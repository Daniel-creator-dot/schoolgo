import pool from '../db.ts';

export interface SMSConfig {
    url: string;
    api_key: string;
    sender_id: string;
}

export class SMSService {
    /**
     * Fetches the centralized SMS API configuration from the Superadmin record.
     * All schools use this centralized configuration to route through the custom gateway.
     */
    private static async getSuperAdminConfig(): Promise<SMSConfig | null> {
        try {
            const result = await pool.query(
                "SELECT sms_api_config FROM organizations WHERE name = 'Superadmin' LIMIT 1"
            );
            return result.rows[0]?.sms_api_config || null;
        } catch (err) {
            console.error('Failed to fetch SMS config:', err);
            return null;
        }
    }

    /**
     * Sends an SMS and deducts credits from the organization's balance.
     * @param org_id The ID of the school organization sending the SMS
     * @param to The recipient phone number
     * @param message The message content
     */
    public static async sendSMS(org_id: string, to: string, message: string): Promise<{ success: boolean; message: string }> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Fetch organization balance and unit price
            const orgResult = await client.query(
                "SELECT sms_balance, sms_unit_price FROM organizations WHERE id = $1",
                [org_id]
            );

            if (orgResult.rows.length === 0) {
                throw new Error('Organization not found');
            }

            const { sms_balance } = orgResult.rows[0];

            if (sms_balance <= 0) {
                throw new Error('Insufficient SMS balance. Please contact Superadmin for top-up.');
            }

            // 2. Fetch Superadmin Gateway Configuration
            const config = await this.getSuperAdminConfig();
            if (!config || !config.url) {
                throw new Error('SMS Gateway not configured in Superadmin settings');
            }

            // 3. Prepare and send the SMS via the custom gateway
            // The gateway URL supports placeholders: {to}, {message}, {api_key}, {sender_id}
            let finalUrl = config.url
                .replace(/{to}/g, encodeURIComponent(to))
                .replace(/{message}/g, encodeURIComponent(message))
                .replace(/{api_key}/g, encodeURIComponent(config.api_key || ''))
                .replace(/{sender_id}/g, encodeURIComponent(config.sender_id || ''));

            console.log(`[SMS] Dispatching to custom gateway: ${finalUrl.split('?')[0]}...`);

            const response = await fetch(finalUrl);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`SMS Gateway Error (${response.status}): ${errorText}`);
            }

            // 4. Deduct 1 credit from balance
            const updateResult = await client.query(
                "UPDATE organizations SET sms_balance = sms_balance - 1 WHERE id = $1 RETURNING sms_balance",
                [org_id]
            );

            // 5. Log transaction audit
            await client.query(
                `INSERT INTO sms_transactions (org_id, type, amount, status, details)
         VALUES ($1, 'DEDUCTION', 1, 'SUCCESS', $2)`,
                [org_id, `SMS sent to ${to}. Remaining balance: ${updateResult.rows[0].sms_balance}`]
            );

            await client.query('COMMIT');
            return { success: true, message: 'SMS sent successfully' };
        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error(`[SMS] Sending failed: ${err.message}`);

            // Attempt to log failure if it wasn't a connection error
            try {
                await pool.query(
                    `INSERT INTO sms_transactions (org_id, type, amount, status, details)
           VALUES ($1, 'DEDUCTION', 0, 'FAILED', $2)`,
                    [org_id, `Failed to send SMS to ${to}: ${err.message}`]
                );
            } catch (logErr) {
                // Ignore logging errors if DB is unreachable
            }

            return { success: false, message: err.message };
        } finally {
            client.release();
        }
    }
}
