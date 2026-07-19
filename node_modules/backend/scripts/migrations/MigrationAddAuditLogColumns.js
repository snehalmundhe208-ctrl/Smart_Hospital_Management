const db = require('../../src/config/DatabaseConfig');
(async () => {
  try {
    await db.query(`
      ALTER TABLE audit_logs 
      ADD COLUMN IF NOT EXISTS module VARCHAR(100),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SUCCESS',
      ADD COLUMN IF NOT EXISTS device VARCHAR(255),
      ADD COLUMN IF NOT EXISTS previous_value JSONB,
      ADD COLUMN IF NOT EXISTS new_value JSONB
    `);
    console.log('Successfully added audit log columns.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
})();
