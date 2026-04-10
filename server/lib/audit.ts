import pool from '../db.ts';

/**
 * Record an action in the system audit logs.
 * 
 * @param userId - ID of the user performing the action
 * @param userName - Display name or email of the user
 * @param action - Descriptive text of what was performed
 * @param ipAddress - Client IP address
 * @param orgId - Organization ID (optional, defaults to null for system-wide actions)
 */
export const recordAuditLog = async (
  userId: string,
  action: string,
  details: string,
  orgId: string | null = null,
  ipAddress: string = '0.0.0.0'
) => {
  try {
    // Fetch user name from the database 
    const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const userName = userRes.rows[0]?.name || 'Unknown User';

    await pool.query(
      'INSERT INTO audit_logs (user_id, user_name, action, details, ip_address, org_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, userName, action, details, ipAddress, orgId]
    );
  } catch (err: any) {
    console.error('Failed to record audit log:', err.message);
    // We don't throw here to avoid failing the actual business transaction 
    // due to a logging failure, unless that's a security requirement.
  }
};
