const db = require('../config/DatabaseConfig');

exports.logActivity = async (userId, action, details, options = {}) => {
  try {
    const { 
      module = 'SYSTEM', 
      status = 'SUCCESS', 
      ipAddress = null, 
      device = null, 
      previousValue = null, 
      newValue = null 
    } = options;

    // Prevent duplicate logs within the last 5 seconds for the same user, action, and details
    const duplicateCheck = await db.query(`
      SELECT id FROM audit_logs 
      WHERE user_id = $1 AND action = $2 AND details = $3 
      AND created_at > NOW() - INTERVAL '5 seconds'
    `, [userId, action, details]);

    if (duplicateCheck.rows.length > 0) return;

    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, ip_address, module, status, device, previous_value, new_value)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      userId, action, details, ipAddress, module, status, device, 
      previousValue ? JSON.stringify(previousValue) : null, 
      newValue ? JSON.stringify(newValue) : null
    ]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    let { page = 1, limit = 50, search, module, status, days } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, u.first_name, u.last_name, u.role, u.email 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (a.action ILIKE $${params.length} OR a.details ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`;
    }
    if (module) {
      params.push(module);
      query += ` AND a.module = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    if (days) {
      params.push(`${days} days`);
      query += ` AND a.created_at >= NOW() - $${params.length}::interval`;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS sub`;
    const totalRes = await db.query(countQuery, params);
    const total = parseInt(totalRes.rows[0].count);

    // Add pagination
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const paginatedParams = [...params, limit, offset];

    const result = await db.query(query, paginatedParams);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    const totalLogs = await db.query(`SELECT COUNT(*) FROM audit_logs`);
    const successful = await db.query(`SELECT COUNT(*) FROM audit_logs WHERE status = 'SUCCESS'`);
    const failed = await db.query(`SELECT COUNT(*) FROM audit_logs WHERE status = 'FAILED'`);
    const warnings = await db.query(`SELECT COUNT(*) FROM audit_logs WHERE status = 'WARNING'`);
    const today = await db.query(`SELECT COUNT(*) FROM audit_logs WHERE DATE(created_at) = CURRENT_DATE`);
    const activeUsers = await db.query(`SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE DATE(created_at) = CURRENT_DATE`);

    res.json({
      totalLogs: parseInt(totalLogs.rows[0].count),
      successful: parseInt(successful.rows[0].count),
      failed: parseInt(failed.rows[0].count),
      warnings: parseInt(warnings.rows[0].count),
      today: parseInt(today.rows[0].count),
      activeUsers: parseInt(activeUsers.rows[0].count)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.logClientEvent = async (req, res) => {
  try {
    const { action, details, module = 'SYSTEM', status = 'SUCCESS' } = req.body;
    await exports.logActivity(req.user.id, action, details, {
      module,
      status,
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });
    res.status(200).json({ message: 'Event logged successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
