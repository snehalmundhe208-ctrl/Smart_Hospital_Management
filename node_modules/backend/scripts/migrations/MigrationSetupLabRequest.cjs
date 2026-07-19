const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres123@localhost:5432/smart_hospital' });
async function setup() {
    let pRes = await pool.query("SELECT p.id FROM patients p JOIN users u ON p.user_id = u.id WHERE u.email = 'narendra@gmail.com'");
    if (pRes.rows.length === 0) return console.log('No narendra patient');
    let pid = pRes.rows[0].id;
    
    // Check if he has a lab request
    let lRes = await pool.query("SELECT id FROM lab_requests WHERE patient_id = $1", [pid]);
    if (lRes.rows.length === 0) {
        // Create one
        let dRes = await pool.query("SELECT id FROM doctors LIMIT 1");
        let did = dRes.rows[0].id;
        await pool.query("INSERT INTO lab_requests (patient_id, doctor_id, test_name, status) VALUES ($1, $2, 'Blood Test for Narendra', 'PENDING')", [pid, did]);
        console.log('Created lab request for Narendra');
    } else {
        console.log('He already has one:', lRes.rows[0].id);
    }
    process.exit(0);
}
setup();
