const db = require('./src/config/DatabaseConfig');

(async () => {
  try {
    await db.query('BEGIN');

    // 1. Create service_prices table
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_name VARCHAR(100) NOT NULL,
        service_type VARCHAR(50) NOT NULL UNIQUE,
        price NUMERIC(10, 2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Insert default values if not exists
    await db.query(`
      INSERT INTO service_prices (service_name, service_type, price) VALUES 
      ('Laboratory Test', 'LAB_TEST', 500),
      ('Medical Certificate', 'CERTIFICATE', 300),
      ('Medical Report', 'REPORT', 200)
      ON CONFLICT (service_type) DO NOTHING;
    `);

    // 3. Alter lab_requests
    await db.query(`
      ALTER TABLE lab_requests 
      ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL
    `);

    // 4. Alter prescriptions
    await db.query(`
      ALTER TABLE prescriptions 
      ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL
    `);

    // 5. If invoices table doesn't have total_amount, just a sanity check
    // Actually invoices already has total_amount, net_amount, status

    await db.query('COMMIT');
    console.log('Database Migration Successful');

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Migration Failed:', error);
  } finally {
    process.exit(0);
  }
})();
