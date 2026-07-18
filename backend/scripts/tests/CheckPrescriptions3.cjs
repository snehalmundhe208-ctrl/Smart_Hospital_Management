const db = require('./src/config/DatabaseConfig');

async function run() {
  try {
    const res = await db.query(`SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'prescriptions'::regclass;`);
    console.log(res.rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
