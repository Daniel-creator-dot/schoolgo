import pool from '../db.ts';

export interface SMSConfig {
    custom_url: string;
    api_key: string;
    sender_id: string;
    supabase_anon_key?: string;
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
            const senderId = orgResult.rows[0].sms_sender_id || config.sender_id || 'School';
            
            let response;
            let responseText;

            // Detect if this is a Supabase Edge Function which requires POST and specific headers
            const isSupabaseFunction = config.custom_url.includes('supabase.co/functions');

            if (isSupabaseFunction) {
                console.log(`[SMS] Dispatching via Supabase POST to: ${config.custom_url}`);
                response = await fetch(config.custom_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': config.supabase_anon_key || '',
                        'x-api-key': config.api_key || ''
                    },
                    body: JSON.stringify({
                        sender: senderId,
                        to: formattedTo,
                        message: message
                    })
                });
            } else {
                // Standard GET-based gateway
                let finalUrl = config.custom_url
                    .replace(/{to}/g, encodeURIComponent(formattedTo))
                    .replace(/{message}/g, encodeURIComponent(message))
                    .replace(/{api_key}/g, encodeURIComponent(config.api_key || ''))
                    .replace(/{sender_id}/g, encodeURIComponent(senderId));

                console.log(`[SMS] Dispatching via GET to: ${finalUrl.substring(0, 120)}...`);
                response = await fetch(finalUrl);
            }

            responseText = await response.text();
            console.log(`[SMS] Gateway response (${response.status}): ${responseText.substring(0, 500)}`);

            if (!response.ok) {
                throw new Error(`SMS Gateway Error (${response.status}): ${responseText}`);
            }

            // Check for common error patterns in the response body
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
                `INSERT INTO sms_transactions (org_id, type, amount, previous_balance, new_balance, description)
                 VALUES ($1, 'DEDUCTION', 1, $2, $3, $4)`,
                [
                    org_id,
                    sms_balance,
                    updateResult.rows[0].sms_balance,
                    `SMS sent to ${formattedTo}. Gateway: ${responseText.substring(0, 200)}`
                ]
            );

            await client.query('COMMIT');
            return { success: true, message: 'SMS sent successfully' };

        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error(`[SMS] Sending failed: ${err.message}`);

            // Attempt to log failure if it wasn't a connection error
            try {
                await pool.query(
                    `INSERT INTO sms_transactions (org_id, type, amount, description)
                     VALUES ($1, 'DEDUCTION', 0, $2)`,
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

    /**
     * Sends the same SMS message to multiple recipients efficiently.
     */
    public static async sendSMSMany(org_id: string, phones: string[], message: string): Promise<{ success: boolean; sent: number; failed: number }> {
        if (phones.length === 0) return { success: true, sent: 0, failed: 0 };
        
        const uniquePhones = [...new Set(phones.map(p => this.formatPhoneNumber(p)))];
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const orgResult = await client.query(
                "SELECT sms_balance FROM organizations WHERE id = $1",
                [org_id]
            );
            
            const balance = orgResult.rows[0]?.sms_balance || 0;
            if (balance < uniquePhones.length) {
                throw new Error(`Insufficient SMS balance. Required: ${uniquePhones.length}, Available: ${balance}`);
            }

            const config = await this.getSuperAdminConfig();
            if (!config || !config.custom_url) {
                throw new Error('SMS Gateway not configured');
            }

            const senderId = config.sender_id || 'School';
            const isSupabaseFunction = config.custom_url.includes('supabase.co/functions');

            let response;
            if (isSupabaseFunction) {
                response = await fetch(config.custom_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': config.supabase_anon_key || '',
                        'x-api-key': config.api_key || ''
                    },
                    body: JSON.stringify({
                        sender: senderId,
                        to: uniquePhones.join(','),
                        message: message
                    })
                });
            } else {
                // Fallback to sequential for GET gateways as they rarely support bulk to
                await client.query('ROLLBACK');
                client.release();
                let sent = 0;
                let failed = 0;
                for (const phone of uniquePhones) {
                    const res = await this.sendSMS(org_id, phone, message);
                    if (res.success) sent++; else failed++;
                }
                return { success: true, sent, failed };
            }

            const responseText = await response.text();
            if (!response.ok) {
                throw new Error(`Gateway Error: ${responseText}`);
            }

            // Deduct credits
            await client.query(
                "UPDATE organizations SET sms_balance = sms_balance - $1 WHERE id = $2",
                [uniquePhones.length, org_id]
            );

            // Log
            await client.query(
                `INSERT INTO sms_transactions (org_id, type, amount, description)
                 VALUES ($1, 'DEDUCTION', $2, $3)`,
                [org_id, uniquePhones.length, `Bulk SMS sent to ${uniquePhones.length} recipients.`]
            );

            await client.query('COMMIT');
            return { success: true, sent: uniquePhones.length, failed: 0 };

        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error('[SMS] Bulk send failed:', err.message);
            return { success: false, sent: 0, failed: uniquePhones.length };
        } finally {
            client.release();
        }
    }
}
