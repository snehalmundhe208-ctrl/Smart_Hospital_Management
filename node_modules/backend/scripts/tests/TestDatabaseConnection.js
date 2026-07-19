const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://postgres:fnJ2Y9fQMsMyPIIr@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" });
pool.query('SELECT 1').then(() => console.log('OK')).catch(console.error).finally(() => process.exit(0));
