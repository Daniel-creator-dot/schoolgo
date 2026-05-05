import pool from '../db.ts';

export interface SMSConfig {
    custom_url: string;
    api_key: string;
    sender_id: string;
}

export class SMSService {
    /**
     * Fetches the centralized SMS API configuration from the system_settings table.
     * All schools use this centralized configuration to route through the custom gateway.
     */
    private static async getSuperAdminConfig(): Promise<SMSConfig | null> {
        try {
            const result = await pool.query(
                "SELECT setting_value FROM system_settings WHERE setting_key = 'sms_gateway_config'"
            );
            return result.rows[0]?.setting_value || null;
        } catch (err) {
            console.error('Failed to fetch SMS config:', err);
            return null;
        }
    }


    /**
     * Cleans and formats phone numbers to international format (233XXXXXXXXX).
     * Specifically handles Ghanaian numbers starting with 0.
     */
    private static formatPhoneNumber(phone: string): string {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0') && (cleaned.length === 10 || cleaned.length === 9)) {
            cleaned = '233' + cleaned.substring(1);
        }
        return cleaned;
    }

    /**
     * Sends an SMS and deducts credits from the organization's balance.
     * @param org_id The ID of the school organization sending the SMS
     * @param to The recipient phone number
     * @param message The message content
     */
    public static async sendSMS(org_id: string, to: string, message: string): Promise<{ success: boolean; message: string }> {
        const formattedTo = this.formatPhoneNumber(to);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Fetch organization balance and unit price
            const orgResult = await client.query(
                "SELECT sms_balance, sms_unit_price, sms_sender_id FROM organizations WHERE id = $1",
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
            if (!config || !config.custom_url) {
                throw new Error('SMS Gateway not configured in Superadmin settings');
            }

            // 3. Prepare and send the SMS via the custom gateway
            // The gateway URL supports placeholders: {to}, {message}, {api_key}, {sender_id}
            const senderId = orgResult.rows[0].sms_sender_id || config.sender_id || '';
            
            let finalUrl = config.custom_url
                .replace(/{to}/g, encodeURIComponent(formattedTo))
                .replace(/{message}/g, encodeURIComponent(message))
                .replace(/{api_key}/g, encodeURIComponent(config.api_key || ''))
                .replace(/{sender_id}/g, encodeURIComponent(senderId));


            console.log(`[SMS] Dispatching to: ${finalUrl.substring(0, 120)}...`);
            console.log(`[SMS] Recipient: ${formattedTo} | Sender ID: ${senderId}`);

            const response = await fetch(finalUrl);
            const responseText = await response.text();

            console.log(`[SMS] Gateway response (${response.status}): ${responseText.substring(0, 500)}`);

            if (!response.ok) {
                throw new Error(`SMS Gateway Error (${response.status}): ${responseText}`);
            }

            // Check for common error patterns in the response body
            // Many SMS gateways return 200 but include error info in the body
            const lowerResp = responseText.toLowerCase();
            if (lowerResp.includes('"error"') || lowerResp.includes('invalid') || lowerResp.includes('failed') || lowerResp.includes('insufficient')) {
                console.warn(`[SMS] Gateway returned 200 but response may indicate failure: ${responseText.substring(0, 300)}`);
            }

            // 4. Deduct 1 credit from balance
            const updateResult = await client.query(
                "UPDATE organizations SET sms_balance = sms_balance - 1 WHERE id = $1 RETURNING sms_balance",
                [org_id]
            );

            // 5. Log transaction audit with gateway response
            await client.query(
                `INSERT INTO sms_transactions (org_id, type, amount, status, details)
         VALUES ($1, 'DEDUCTION', 1, 'SUCCESS', $2)`,
                [org_id, `SMS sent to ${formattedTo}. Gateway: ${responseText.substring(0, 200)}. Balance: ${updateResult.rows[0].sms_balance}`]
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
                    [org_id, `Failed to send SMS to ${formattedTo}: ${err.message}`]
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
