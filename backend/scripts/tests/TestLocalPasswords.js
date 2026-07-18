const { Pool } = require('pg');
const passwords = ['postgres', 'password', 'admin', 'root', '123456', '', 'fnJ2Y9fQMsMyPIIr'];

async function test() {
  for (let pwd of passwords) {
    try {
      const pool = new Pool({ connectionString: `postgresql://postgres:${pwd}@localhost:5432/postgres` });
      await pool.query('SELECT 1');
      console.log(`Success with password: ${pwd}`);
      process.exit(0);
    } catch (e) {}
  }
  console.log('All failed');
  process.exit(1);
}
test();
