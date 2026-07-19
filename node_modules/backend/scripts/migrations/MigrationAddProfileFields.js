const db = require('./src/config/db');
require('dotenv').config();
(async () => {
  try {
    await db.query(
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS dob DATE,
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(50);
    );
    console.log('Columns added to users table');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
