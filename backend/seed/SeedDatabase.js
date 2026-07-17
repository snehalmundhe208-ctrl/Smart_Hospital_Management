const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('Starting seed process...');
    await client.query('BEGIN');

    // Backup custom users and their patient profiles
    const customUsersRes = await client.query(`
      SELECT * FROM users 
      WHERE email NOT LIKE '%@hospital.com' 
      AND email NOT LIKE '%@example.com'
    `);
    const customUsers = customUsersRes.rows;
    
    let customPatients = [];
    if (customUsers.length > 0) {
      const userIds = customUsers.map(u => u.id);
      const params = userIds.map((_, i) => `$${i + 1}`).join(',');
      const customPatientsRes = await client.query(`
        SELECT * FROM patients WHERE user_id IN (${params})
      `, userIds);
      customPatients = customPatientsRes.rows;
    }

    // Apply schema
    // const schemaPath = path.join(__dirname, '../../database/schema.sql');
    // if (fs.existsSync(schemaPath)) {
    //   const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    //   await client.query(schemaSql);
    //   console.log('✅ Schema applied');
    // }

    // Clear existing data (idempotent)
    await client.query(`
      TRUNCATE TABLE feedback, audit_logs, notifications, invoice_items, invoices, medicine_order_items, medicine_orders, medicines,
        lab_requests, prescription_items, prescriptions, appointments,
        doctors, patients, departments, users, blood_bank, ambulance_requests, beds, wards
      RESTART IDENTITY CASCADE;
    `);
    console.log('Cleared old data');

    const hash = await bcrypt.hash('Password123!', 10);

    // --- DEPARTMENTS ---
    const deptData = ['Cardiology','Neurology','Orthopedics','Pediatrics','General Surgery'];
    const deptIds = [];
    for (const name of deptData) {
      const r = await client.query(`INSERT INTO departments (name) VALUES ($1) RETURNING id`, [name]);
      deptIds.push(r.rows[0].id);
    }
    console.log('✅ Departments seeded');

    // --- ADMIN ---
    await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, profile_image_url)
       VALUES ('admin@hospital.com', $1, 'ADMIN', 'Super', 'Admin', '9000000000', '/images/profiles/staff-01.jpg')`,
      [hash]
    );

    // --- RECEPTIONISTS ---
    const receptionNames = [['Priya','Sharma'],['Rahul','Mehta'],['Anita','Patel']];
    for (let i = 0; i < receptionNames.length; i++) {
      const [fn, ln] = receptionNames[i];
      await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, profile_image_url)
         VALUES ($1, $2, 'RECEPTIONIST', $3, $4, '900000000${i+1}', $5)`,
        [`reception${i+1}@hospital.com`, hash, fn, ln, `/images/profiles/patient-0${(i % 3) + 1}.jpg`]
      );
    }

    // --- LAB STAFF ---
    for (let i = 1; i <= 2; i++) {
      await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, profile_image_url)
         VALUES ($1, $2, 'LAB', $3, 'Lab', '910000000${i}', $4)`,
        [`lab${i}@hospital.com`, hash, `LabTech${i}`, `/images/profiles/clinician-0${i}.jpg`]
      );
    }

    // --- PHARMACISTS ---
    for (let i = 1; i <= 2; i++) {
      await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, profile_image_url)
         VALUES ($1, $2, 'PHARMACY', $3, 'Pharmacy', '920000000${i}', $4)`,
        [`pharmacy${i}@hospital.com`, hash, `Pharmacist${i}`, `/images/profiles/clinician-0${i}.jpg`]
      );
    }

    // --- DOCTORS ---
    const doctorInfo = [
      { fn: 'Arjun', ln: 'Kapoor', spec: 'Cardiologist', fee: 800, profile: '/images/profiles/doctor-01.jpg' },
      { fn: 'Meena', ln: 'Verma',  spec: 'Neurologist',  fee: 900, profile: '/images/profiles/doctor-02.jpg' },
      { fn: 'Suresh', ln: 'Nair',  spec: 'Orthopedist',  fee: 700, profile: '/images/profiles/clinician-01.jpg' },
      { fn: 'Kavitha', ln: 'Rao',  spec: 'Pediatrician', fee: 600, profile: '/images/profiles/doctor-01.jpg' },
      { fn: 'Vikram', ln: 'Singh', spec: 'Surgeon',      fee: 1000, profile: '/images/profiles/staff-01.jpg' },
      { fn: 'Amit', ln: 'Patel', spec: 'Cardiologist', fee: 750, profile: '/images/profiles/doctor-01.jpg' },
      { fn: 'Priya', ln: 'Sharma', spec: 'Dermatologist', fee: 650, profile: '/images/profiles/doctor-02.jpg' },
      { fn: 'Rahul', ln: 'Gupta', spec: 'Psychiatrist', fee: 850, profile: '/images/profiles/clinician-01.jpg' },
      { fn: 'Neha', ln: 'Singh', spec: 'Gynecologist', fee: 950, profile: '/images/profiles/doctor-01.jpg' },
      { fn: 'Rajesh', ln: 'Kumar', spec: 'Orthopedist', fee: 750, profile: '/images/profiles/staff-01.jpg' },
      { fn: 'Anil', ln: 'Desai', spec: 'Gastroenterologist', fee: 850, profile: '/images/profiles/clinician-02.jpg' },
      { fn: 'Sunita', ln: 'Menon', spec: 'Endocrinologist', fee: 900, profile: '/images/profiles/clinician-03.jpg' },
      { fn: 'Karthik', ln: 'Raj', spec: 'Pulmonologist', fee: 800, profile: '/images/profiles/clinician-04.jpg' },
      { fn: 'Ranjit', ln: 'Bose', spec: 'Oncologist', fee: 1200, profile: '/images/profiles/clinician-05.jpg' },
      { fn: 'Smriti', ln: 'Iyer', spec: 'Rheumatologist', fee: 750, profile: '/images/profiles/clinician-06.jpg' },
      { fn: 'Varun', ln: 'Dhawan', spec: 'Urologist', fee: 900, profile: '/images/profiles/clinician-07.jpg' },
      { fn: 'Pooja', ln: 'Hegde', spec: 'Ophthalmologist', fee: 600, profile: '/images/profiles/clinician-08.jpg' },
      { fn: 'Ramesh', ln: 'Babu', spec: 'ENT Specialist', fee: 650, profile: '/images/profiles/clinician-09.jpg' }
    ];
    const doctorIds = [];
    for (let i = 0; i < doctorInfo.length; i++) {
      const d = doctorInfo[i];
      const uRes = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, profile_image_url)
         VALUES ($1, $2, 'DOCTOR', $3, $4, '930000000${i}', $5) RETURNING id`,
        [`doctor${i+1}@hospital.com`, hash, d.fn, d.ln, d.profile]
      );
      const dRes = await client.query(
        `INSERT INTO doctors (user_id, department_id, specialization, experience_years, consultation_fee,
           available_days, shift_start, shift_end)
         VALUES ($1, $2, $3, $4, $5, 'Monday,Tuesday,Wednesday,Thursday,Friday', '09:00', '17:00')
         RETURNING id`,
        [uRes.rows[0].id, deptIds[i % deptIds.length], d.spec, 10 + i, d.fee]
      );
      doctorIds.push(dRes.rows[0].id);
    }
    console.log('✅ Doctors seeded');

    // --- PATIENTS (15) ---
    const patientData = [
      { fn:'Arun', ln:'Kumar',    dob:'1985-03-12', gender:'Male',   bg:'A+', allergy:'Penicillin', chronic:'Hypertension' },
      { fn:'Sunita', ln:'Devi',   dob:'1992-07-25', gender:'Female', bg:'B+', allergy:'Aspirin',    chronic:'Diabetes' },
      { fn:'Ravi', ln:'Shankar',  dob:'1978-11-08', gender:'Male',   bg:'O+', allergy:'None',       chronic:'None' },
      { fn:'Lakshmi', ln:'Nair',  dob:'2001-01-30', gender:'Female', bg:'AB+',allergy:'Sulfa',      chronic:'Asthma' },
      { fn:'Karan', ln:'Mehta',   dob:'1995-05-15', gender:'Male',   bg:'A-', allergy:'None',       chronic:'None' },
      { fn:'Geeta', ln:'Pillai',  dob:'1968-09-20', gender:'Female', bg:'B-', allergy:'Ibuprofen',  chronic:'Arthritis' },
      { fn:'Mohan', ln:'Das',     dob:'1955-12-01', gender:'Male',   bg:'O-', allergy:'None',       chronic:'COPD' },
      { fn:'Preethi', ln:'Rao',   dob:'1990-04-18', gender:'Female', bg:'A+', allergy:'Latex',      chronic:'None' },
      { fn:'Suraj', ln:'Patil',   dob:'2005-08-22', gender:'Male',   bg:'B+', allergy:'None',       chronic:'None' },
      { fn:'Divya', ln:'Menon',   dob:'1983-06-10', gender:'Female', bg:'AB-',allergy:'Codeine',    chronic:'Migraine' },
      { fn:'Vijay', ln:'Bhat',    dob:'1972-02-28', gender:'Male',   bg:'O+', allergy:'None',       chronic:'Hypertension' },
      { fn:'Asha', ln:'Iyer',     dob:'1998-10-05', gender:'Female', bg:'A+', allergy:'Pollen',     chronic:'Allergy' },
      { fn:'Naveen', ln:'Gowda',  dob:'1986-03-17', gender:'Male',   bg:'B+', allergy:'None',       chronic:'None' },
      { fn:'Rekha', ln:'Joshi',   dob:'1963-07-09', gender:'Female', bg:'O+', allergy:'Aspirin',    chronic:'Heart Disease' },
      { fn:'Akash', ln:'Sharma',  dob:'2010-11-14', gender:'Male',   bg:'A+', allergy:'None',       chronic:'None' },
      { fn:'Rohan', ln:'Verma',   dob:'1991-02-15', gender:'Male',   bg:'B+', allergy:'None',       chronic:'None' },
      { fn:'Sneha', ln:'Reddy',   dob:'1988-08-22', gender:'Female', bg:'O+', allergy:'Peanuts',    chronic:'Asthma' },
      { fn:'Vikash', ln:'Singh',  dob:'1975-12-05', gender:'Male',   bg:'A-', allergy:'None',       chronic:'Diabetes' },
      { fn:'Pooja', ln:'Mishra',  dob:'1994-04-12', gender:'Female', bg:'B-', allergy:'None',       chronic:'None' },
      { fn:'Rahul', ln:'Bose',    dob:'1982-09-30', gender:'Male',   bg:'AB+',allergy:'Dust',       chronic:'Hypertension' },
      { fn:'Meera', ln:'Natarajan',dob:'1969-01-18', gender:'Female',bg:'O-', allergy:'None',       chronic:'Arthritis' },
      { fn:'Sanjay', ln:'Dutt',   dob:'1958-07-07', gender:'Male',   bg:'A+', allergy:'Aspirin',    chronic:'Heart Disease' },
      { fn:'Kirti', ln:'Sen',     dob:'2003-11-25', gender:'Female', bg:'B+', allergy:'None',       chronic:'None' },
      { fn:'Deepak', ln:'Chopra', dob:'1980-05-14', gender:'Male',   bg:'O+', allergy:'None',       chronic:'None' },
      { fn:'Anjali', ln:'Tiwari', dob:'1997-03-08', gender:'Female', bg:'A+', allergy:'Sulfa',      chronic:'None' },
      { fn:'Gaurav', ln:'Kaur',   dob:'1989-10-19', gender:'Male',   bg:'B-', allergy:'None',       chronic:'None' },
      { fn:'Swati', ln:'Jain',    dob:'1974-06-21', gender:'Female', bg:'O+', allergy:'Penicillin', chronic:'Diabetes' },
      { fn:'Tarun', ln:'Garg',    dob:'1993-12-11', gender:'Male',   bg:'A-', allergy:'None',       chronic:'Asthma' },
      { fn:'Neha', ln:'Aggarwal', dob:'2000-02-02', gender:'Female', bg:'AB-',allergy:'None',       chronic:'None' },
      { fn:'Manoj', ln:'Pandey',  dob:'1965-08-14', gender:'Male',   bg:'O-', allergy:'Latex',      chronic:'COPD' },
      { fn:'Aarav', ln:'Sharma', dob:'1990-01-10', gender:'Male', bg:'A+', allergy:'None', chronic:'None' },
      { fn:'Vivaan', ln:'Verma', dob:'1985-02-15', gender:'Male', bg:'B+', allergy:'Penicillin', chronic:'Diabetes' },
      { fn:'Aditya', ln:'Chopra', dob:'1975-03-20', gender:'Male', bg:'O+', allergy:'None', chronic:'Hypertension' },
      { fn:'Vihaan', ln:'Singh', dob:'2000-04-25', gender:'Male', bg:'AB+', allergy:'Peanuts', chronic:'None' },
      { fn:'Arjun', ln:'Malhotra', dob:'1995-05-30', gender:'Male', bg:'A-', allergy:'None', chronic:'Asthma' },
      { fn:'Sai', ln:'Kumar', dob:'1980-06-05', gender:'Male', bg:'B-', allergy:'Dust', chronic:'None' },
      { fn:'Ayaan', ln:'Das', dob:'1970-07-10', gender:'Male', bg:'O-', allergy:'None', chronic:'Arthritis' },
      { fn:'Krishna', ln:'Rao', dob:'1960-08-15', gender:'Male', bg:'AB-', allergy:'Sulfa', chronic:'None' },
      { fn:'Ishaan', ln:'Patel', dob:'1992-09-20', gender:'Male', bg:'A+', allergy:'None', chronic:'None' },
      { fn:'Shaurya', ln:'Nair', dob:'1988-10-25', gender:'Male', bg:'B+', allergy:'Latex', chronic:'None' },
      { fn:'Aaradhya', ln:'Gupta', dob:'1993-11-30', gender:'Female', bg:'O+', allergy:'None', chronic:'Thyroid' },
      { fn:'Kavya', ln:'Reddy', dob:'1983-12-05', gender:'Female', bg:'AB+', allergy:'Aspirin', chronic:'None' },
      { fn:'Diya', ln:'Bhat', dob:'1973-01-10', gender:'Female', bg:'A-', allergy:'None', chronic:'None' },
      { fn:'Ananya', ln:'Menon', dob:'2005-02-15', gender:'Female', bg:'B-', allergy:'Pollen', chronic:'None' },
      { fn:'Isha', ln:'Iyer', dob:'1998-03-20', gender:'Female', bg:'O-', allergy:'None', chronic:'Migraine' },
      { fn:'Riya', ln:'Joshi', dob:'1986-04-25', gender:'Female', bg:'AB-', allergy:'None', chronic:'None' },
      { fn:'Aahna', ln:'Mehta', dob:'1976-05-30', gender:'Female', bg:'A+', allergy:'Penicillin', chronic:'Diabetes' },
      { fn:'Navya', ln:'Pillai', dob:'1966-06-05', gender:'Female', bg:'B+', allergy:'None', chronic:'Hypertension' },
      { fn:'Mira', ln:'Tiwari', dob:'1991-07-10', gender:'Female', bg:'O+', allergy:'Dust', chronic:'Asthma' },
      { fn:'Prisha', ln:'Pandey', dob:'1981-08-15', gender:'Female', bg:'AB+', allergy:'None', chronic:'None' },
      { fn:'Rohan', ln:'Desai', dob:'1994-09-20', gender:'Male', bg:'A-', allergy:'Sulfa', chronic:'None' },
      { fn:'Aman', ln:'Bose', dob:'1984-10-25', gender:'Male', bg:'B-', allergy:'None', chronic:'None' },
      { fn:'Kabir', ln:'Sen', dob:'1974-11-30', gender:'Male', bg:'O-', allergy:'Latex', chronic:'Arthritis' },
      { fn:'Aryan', ln:'Kaur', dob:'2002-12-05', gender:'Male', bg:'AB-', allergy:'None', chronic:'None' },
      { fn:'Dhruv', ln:'Jain', dob:'1997-01-10', gender:'Male', bg:'A+', allergy:'Aspirin', chronic:'None' },
      { fn:'Meera', ln:'Garg', dob:'1987-02-15', gender:'Female', bg:'B+', allergy:'None', chronic:'Thyroid' },
      { fn:'Sanya', ln:'Aggarwal', dob:'1977-03-20', gender:'Female', bg:'O+', allergy:'Peanuts', chronic:'None' },
      { fn:'Zara', ln:'Chopra', dob:'2008-04-25', gender:'Female', bg:'AB+', allergy:'None', chronic:'None' },
      { fn:'Avni', ln:'Malhotra', dob:'1996-05-30', gender:'Female', bg:'A-', allergy:'None', chronic:'Migraine' },
      { fn:'Nisha', ln:'Kumar', dob:'1982-06-05', gender:'Female', bg:'B-', allergy:'Pollen', chronic:'None' }
    ];
    const patientIds = [];
    for (let i = 0; i < patientData.length; i++) {
      const p = patientData[i];
      const uRes = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, profile_image_url)
         VALUES ($1, $2, 'PATIENT', $3, $4, '98000000${String(i).padStart(2,'0')}', $5) RETURNING id`,
        [`${i === 0 ? 'patient' : 'patient' + (i + 1)}@example.com`, hash, p.fn, p.ln, `/images/profiles/patient-0${(i % 3) + 1}.jpg`]
      );
      const pRes = await client.query(
        `INSERT INTO patients (user_id, patient_id, dob, gender, blood_group, allergies, chronic_diseases,
           emergency_contact_name, emergency_contact_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Family Contact', '9999999999') RETURNING id`,
        [uRes.rows[0].id, `SHMS-PT-${1001+i}`, p.dob, p.gender, p.bg, p.allergy, p.chronic]
      );
      patientIds.push(pRes.rows[0].id);
    }
    console.log('✅ Patients seeded');

    // --- APPOINTMENTS (80) ---
    const statuses = ['COMPLETED', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'CANCELLED'];
    const aptIds = [];
    for (let i = 0; i < 80; i++) {
      const daysOffset = i < 40 ? -(40 - i) : (i - 39);
      const aptDate = new Date();
      aptDate.setDate(aptDate.getDate() + daysOffset);
      const r = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, type, symptoms)
         VALUES ($1, $2, $3, $4, $5, 'WALK_IN', $6) RETURNING id`,
        [
          patientIds[i % patientIds.length],
          doctorIds[i % doctorIds.length],
          aptDate.toISOString().split('T')[0],
          `${9 + (i % 8)}:00:00`,
          statuses[i % statuses.length],
          ['Fever and headache','Chest pain','Joint pain','Cough and cold','Dizziness'][i % 5]
        ]
      );
      aptIds.push(r.rows[0].id);
    }
    console.log('✅ Appointments seeded');

    // --- PRESCRIPTIONS (20) ---
    const diagnoses = ['Viral fever','Hypertension','Type 2 Diabetes','Asthma','Osteoarthritis','Migraine','Allergic Rhinitis'];
    for (let i = 0; i < 20; i++) {
      const pRes = await client.query(
        `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, diagnosis, notes)
         VALUES ($1, $2, $3, $4, 'Follow up in 2 weeks') RETURNING id`,
        [aptIds[i], doctorIds[i % doctorIds.length], patientIds[i % patientIds.length], diagnoses[i % diagnoses.length]]
      );
      const pId = pRes.rows[0].id;
      await client.query(
        `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration)
         VALUES ($1, $2, $3, $4, $5)`,
        [pId, 'Paracetamol', '500mg', 'Twice daily', '5 days']
      );
      await client.query(
        `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration)
         VALUES ($1, $2, $3, $4, $5)`,
        [pId, 'Vitamin C', '1000mg', 'Once daily', '30 days']
      );
    }
    console.log('✅ Prescriptions seeded');

    // --- LAB REQUESTS (20) ---
    const tests = ['CBC','Blood Sugar','Lipid Profile','Urine Analysis','Thyroid Panel',
                   'Liver Function','Kidney Function','X-Ray Chest','ECG','MRI Brain',
                   'Vitamin D', 'Vitamin B12', 'HbA1c', 'CRP', 'D-Dimer'];
    const labStatuses = ['COMPLETED','COMPLETED','COMPLETED','SAMPLE_COLLECTED','PENDING',
                         'PENDING','PENDING','SAMPLE_COLLECTED','COMPLETED','PENDING',
                         'COMPLETED','SAMPLE_COLLECTED','PENDING','COMPLETED','PENDING',
                         'COMPLETED','COMPLETED','PENDING','SAMPLE_COLLECTED','COMPLETED'];
    for (let i = 0; i < 20; i++) {
      await client.query(
        `INSERT INTO lab_requests (appointment_id, patient_id, doctor_id, test_name, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [aptIds[i], patientIds[i % patientIds.length], doctorIds[i % doctorIds.length], tests[i % tests.length], labStatuses[i]]
      );
    }
    console.log('✅ Lab requests seeded');

    // --- PHARMACY MEDICINES ---
    const medicineData = [
      { name:'Paracetamol 500mg', cat:'Analgesic',    price:2.50,  stock:500, min:50,  expiry:'2027-12-31', desc: 'Used to treat mild to moderate pain and relieve fever.', dosage: '1 tablet every 6 hours as needed.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Amoxicillin 250mg', cat:'Antibiotic',   price:8.00,  stock:200, min:30,  expiry:'2026-06-30', desc: 'Penicillin antibiotic used to treat bacterial infections.', dosage: '1 capsule three times a day.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'Metformin 500mg',   cat:'Antidiabetic', price:5.00,  stock:8,   min:20,  expiry:'2027-03-15', desc: 'First-line medication for the treatment of type 2 diabetes.', dosage: '1 tablet twice a day with meals.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Atorvastatin 10mg', cat:'Statin',       price:12.00, stock:150, min:20,  expiry:'2027-09-30', desc: 'Used to lower cholesterol levels and reduce risk of heart disease.', dosage: '1 tablet once daily in the evening.', img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=60' },
      { name:'Amlodipine 5mg',    cat:'Antihypert.',  price:7.50,  stock:5,   min:20,  expiry:'2026-08-15', desc: 'Calcium channel blocker used to treat high blood pressure.', dosage: '1 tablet once a day.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Omeprazole 20mg',   cat:'PPI',          price:4.00,  stock:300, min:50,  expiry:'2027-05-20', desc: 'Used to treat GERD and stomach ulcers.', dosage: '1 capsule daily before breakfast.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'Cetirizine 10mg',   cat:'Antihistamine',price:3.00,  stock:250, min:30,  expiry:'2028-01-10', desc: 'Antihistamine used to relieve allergy symptoms.', dosage: '1 tablet daily.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Azithromycin 500mg',cat:'Antibiotic',   price:15.00, stock:7,   min:20,  expiry:'2025-12-01', desc: 'Macrolide antibiotic used for various bacterial infections.', dosage: '1 tablet daily for 3 days.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'Ibuprofen 400mg',   cat:'NSAID',        price:3.50,  stock:400, min:50,  expiry:'2027-11-30', desc: 'Nonsteroidal anti-inflammatory drug used for pain and inflammation.', dosage: '1 tablet every 8 hours with food.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Salbutamol Inhaler',cat:'Bronchodil.',  price:45.00, stock:60,  min:10,  expiry:'2026-07-25', desc: 'Reliever inhaler for asthma and COPD.', dosage: '1-2 puffs as needed for shortness of breath.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Losartan 50mg',     cat:'Antihypert.',  price:9.00,  stock:180, min:20,  expiry:'2027-08-31', desc: 'Angiotensin II receptor blocker for high blood pressure.', dosage: '1 tablet daily.', img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=60' },
      { name:'Vitamin D3 1000IU', cat:'Supplement',   price:6.00,  stock:350, min:40,  expiry:'2028-03-01', desc: 'Dietary supplement to support bone health.', dosage: '1 tablet daily with a meal.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Iron Tablets 150mg',cat:'Supplement',   price:4.50,  stock:9,   min:25,  expiry:'2027-02-28', desc: 'Supplement to treat or prevent iron deficiency anemia.', dosage: '1 tablet daily.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'Clopidogrel 75mg',  cat:'Antiplatelet', price:20.00, stock:90,  min:15,  expiry:'2026-12-15', desc: 'Used to prevent blood clots.', dosage: '1 tablet daily.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Pantoprazole 40mg', cat:'PPI',          price:5.50,  stock:200, min:30,  expiry:'2027-07-10', desc: 'Reduces stomach acid to treat GERD.', dosage: '1 tablet daily before a meal.', img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=60' },
      { name:'Dolo 650mg',        cat:'Analgesic',    price:2.80,  stock:600, min:60,  expiry:'2028-06-01', desc: 'High dose paracetamol for fever and body ache.', dosage: '1 tablet every 6 hours as needed.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Ciprofloxacin 500mg',cat:'Antibiotic',  price:10.00, stock:4,   min:20,  expiry:'2025-11-15', desc: 'Fluoroquinolone antibiotic for various infections.', dosage: '1 tablet twice a day.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'Vitamin B12 500mcg',cat:'Supplement',   price:8.00,  stock:270, min:30,  expiry:'2027-12-01', desc: 'Supports nerve function and energy production.', dosage: '1 tablet daily.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Prednisolone 5mg',  cat:'Steroid',      price:6.50,  stock:120, min:20,  expiry:'2026-10-31', desc: 'Corticosteroid to treat inflammation.', dosage: 'As directed by physician.', img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=60' },
      { name:'Calcium 500mg',     cat:'Supplement',   price:5.00,  stock:310, min:40,  expiry:'2028-04-15', desc: 'Dietary supplement for strong bones.', dosage: '1 tablet twice daily.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Ondansetron 4mg',   cat:'Antiemetic',   price:7.00,  stock:150, min:20,  expiry:'2027-11-20', desc: 'Used to prevent nausea and vomiting.', dosage: '1 tablet every 8 hours as needed.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'Cetaphil Cleanser', cat:'Skincare',     price:25.00, stock:80,  min:10,  expiry:'2028-12-31', desc: 'Gentle skin cleanser for sensitive skin.', dosage: 'Apply to skin and rub gently.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Loratadine 10mg',   cat:'Antihistamine',price:4.50,  stock:210, min:30,  expiry:'2027-04-10', desc: 'Non-drowsy antihistamine for allergies.', dosage: '1 tablet daily.', img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=60' },
      { name:'Montelukast 10mg',  cat:'Antiasthmatic',price:12.50, stock:110, min:20,  expiry:'2026-09-30', desc: 'Used to prevent asthma attacks and allergies.', dosage: '1 tablet daily in the evening.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Levothyroxine 50mcg',cat:'Hormone',     price:8.50,  stock:130, min:20,  expiry:'2028-02-15', desc: 'Used to treat hypothyroidism.', dosage: '1 tablet daily on an empty stomach.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'N95 Face Mask',     cat:'Equipment',    price:2.50,  stock:1500,min:200, expiry:'2029-01-01', desc: 'High filtration N95 mask for respiratory protection.', dosage: 'Wear when needed.', img: 'https://images.unsplash.com/photo-1586985289906-406988974504?w=800&auto=format&fit=crop&q=60' },
      { name:'Surgical Gloves',   cat:'Equipment',    price:12.00, stock:300, min:50,  expiry:'2028-05-01', desc: 'Box of 100 sterile surgical gloves.', dosage: 'Use once and discard.', img: 'https://images.unsplash.com/photo-1584036533827-45bce166ad94?w=800&auto=format&fit=crop&q=60' },
      { name:'Hand Sanitizer 500ml',cat:'Hygiene',    price:5.50,  stock:400, min:50,  expiry:'2026-11-30', desc: '70% alcohol-based hand sanitizer.', dosage: 'Apply to hands and rub thoroughly.', img: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800&auto=format&fit=crop&q=60' },
      { name:'Dettol Antiseptic', cat:'Hygiene',      price:4.00,  stock:250, min:40,  expiry:'2027-10-15', desc: 'Antiseptic liquid for first aid and personal hygiene.', dosage: 'Dilute before use.', img: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800&auto=format&fit=crop&q=60' },
      { name:'Cotton Bandages',   cat:'First Aid',    price:1.50,  stock:600, min:100, expiry:'2030-12-31', desc: 'Sterile cotton bandages for wound care.', dosage: 'Apply to cleaned wound.', img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=60' },
      { name:'Syringe 5ml',       cat:'Equipment',    price:0.50,  stock:1000,min:100, expiry:'2029-06-30', desc: 'Sterile disposable syringe with needle.', dosage: 'Single use only.', img: 'https://images.unsplash.com/photo-1583947581924-860bda6a45df?w=800&auto=format&fit=crop&q=60' },
      { name:'Digital Thermometer',cat:'Equipment',   price:15.00, stock:120, min:20,  expiry:'2035-01-01', desc: 'Accurate digital thermometer for oral/underarm use.', dosage: 'Read instructions carefully.', img: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&auto=format&fit=crop&q=60' },
      { name:'Pulse Oximeter',    cat:'Equipment',    price:25.00, stock:80,  min:15,  expiry:'2035-01-01', desc: 'Fingertip pulse oximeter for SpO2 and pulse rate.', dosage: 'Clip on finger to measure.', img: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&auto=format&fit=crop&q=60' },
      { name:'BP Monitor',        cat:'Equipment',    price:45.00, stock:40,  min:10,  expiry:'2035-01-01', desc: 'Automatic blood pressure monitor with digital display.', dosage: 'Use as per manual.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'Nebulizer Machine', cat:'Equipment',    price:55.00, stock:30,  min:5,   expiry:'2035-01-01', desc: 'Compressor nebulizer for aerosol medication delivery.', dosage: 'Use with prescribed medication.', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=60' },
      { name:'Volini Pain Relief',cat:'Analgesic',    price:3.50,  stock:350, min:40,  expiry:'2027-04-30', desc: 'Pain relief spray for joint and muscle pains.', dosage: 'Spray on affected area 3-4 times a day.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Hydrocortisone 1%', cat:'Steroid',      price:4.00,  stock:200, min:30,  expiry:'2026-08-31', desc: 'Topical cream for skin inflammation and itching.', dosage: 'Apply thinly 1-2 times daily.', img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=60' },
      { name:'Tetanus Injection', cat:'Vaccine',      price:1.50,  stock:150, min:20,  expiry:'2025-10-31', desc: 'Tetanus toxoid vaccine injection.', dosage: 'Administer intramuscularly.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'Cough Syrup (Benadryl)', cat:'Syrup',    price:4.50,  stock:200, min:30,  expiry:'2026-10-31', desc: 'Cough syrup for dry cough relief.', dosage: '10ml twice a day.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'B Complex Syrup',   cat:'Syrup',        price:3.00,  stock:180, min:30,  expiry:'2027-05-30', desc: 'Vitamin B complex syrup for general health.', dosage: '5ml daily.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60' },
      { name:'Insulin Glargine',  cat:'Injection',    price:25.00, stock:50,  min:10,  expiry:'2026-01-31', desc: 'Long-acting insulin for diabetes control.', dosage: 'As prescribed by doctor.', img: 'https://images.unsplash.com/photo-1583947581924-860bda6a45df?w=800&auto=format&fit=crop&q=60' },
      { name:'Ceftriaxone 1g',    cat:'Injection',    price:15.00, stock:100, min:20,  expiry:'2025-12-15', desc: 'Broad-spectrum antibiotic injection.', dosage: 'Intravenous or intramuscular.', img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60' },
      { name:'Diclofenac Gel',    cat:'Cream',        price:5.00,  stock:250, min:40,  expiry:'2028-02-28', desc: 'Topical gel for pain and swelling.', dosage: 'Apply on affected area.', img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=60' },
      { name:'Betadine Ointment', cat:'Cream',        price:3.50,  stock:300, min:50,  expiry:'2027-09-30', desc: 'Antiseptic ointment for wounds and cuts.', dosage: 'Apply a thin layer.', img: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800&auto=format&fit=crop&q=60' },
      { name:'Glucometer Kit',    cat:'Equipment',    price:35.00, stock:60,  min:15,  expiry:'2035-01-01', desc: 'Blood glucose monitoring system with 50 strips.', dosage: 'Use as per manual.', img: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&auto=format&fit=crop&q=60' }
    ];
    for (const m of medicineData) {
      await client.query(
        `INSERT INTO medicines (name, category, unit_price, stock_quantity, min_stock_level, expiry_date, description, dosage_information, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [m.name, m.cat, m.price, m.stock, m.min, m.expiry, m.desc, m.dosage, m.img]
      );
    }
    console.log('✅ Medicines seeded');

    // --- INVOICES (5) ---
    const invoiceStatuses = ['PAID','PAID','PAID','UNPAID','UNPAID'];
    for (let i = 0; i < 5; i++) {
      const invRes = await client.query(
        `INSERT INTO invoices (patient_id, appointment_id, total_amount, discount, tax, net_amount, status, payment_method)
         VALUES ($1, $2, 1300.00, 100.00, 65.00, 1265.00, $3, 'Cash') RETURNING id`,
        [patientIds[i], aptIds[i], invoiceStatuses[i]]
      );
      const invId = invRes.rows[0].id;
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, amount, type) VALUES ($1,'Consultation Fee',500.00,'CONSULTATION')`, [invId]
      );
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, amount, type) VALUES ($1,'Lab Tests',500.00,'LAB_TEST')`, [invId]
      );
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, amount, type) VALUES ($1,'Medicines',300.00,'MEDICINE')`, [invId]
      );
    }
    console.log('✅ Invoices seeded');

    // --- NOTIFICATIONS ---
    const adminUser = await client.query(`SELECT id FROM users WHERE role='ADMIN' LIMIT 1`);
    if (adminUser.rows.length > 0) {
      const notifData = [
        { title:'New Patient Registered', msg:'Patient Arun Kumar has registered.', type:'USER' },
        { title:'Appointment Booked',     msg:'Dr. Kapoor has a new appointment.', type:'APPOINTMENT' },
        { title:'Low Stock Alert',        msg:'Metformin is below minimum stock.', type:'STOCK' },
        { title:'Lab Report Ready',       msg:'CBC report for patient SHMS-PT-1001.', type:'LAB' },
        { title:'Invoice Paid',           msg:'Invoice #1 has been paid.',          type:'BILLING' },
      ];
      for (const n of notifData) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)`,
          [adminUser.rows[0].id, n.title, n.msg, n.type]
        );
      }
    }
    console.log('✅ Notifications seeded');

    // --- WARDS & BEDS ---
    const wardsData = [
      { name: 'General Ward A', type: 'GENERAL', capacity: 10 },
      { name: 'ICU Unit 1', type: 'ICU', capacity: 5 },
      { name: 'Emergency Ward', type: 'EMERGENCY', capacity: 8 },
      { name: 'Maternity Ward', type: 'MATERNITY', capacity: 6 },
      { name: 'Private Room Suite', type: 'GENERAL', capacity: 5 }
    ];
    for (const w of wardsData) {
      const wardRes = await client.query(
        `INSERT INTO wards (name, type, capacity) VALUES ($1, $2, $3) RETURNING id`,
        [w.name, w.type, w.capacity]
      );
      const wardId = wardRes.rows[0].id;
      for (let i = 1; i <= w.capacity; i++) {
        const isOccupied = Math.random() > 0.5;
        const status = isOccupied ? 'OCCUPIED' : 'AVAILABLE';
        const pId = isOccupied ? patientIds[Math.floor(Math.random() * patientIds.length)] : null;
        await client.query(
          `INSERT INTO beds (ward_id, bed_number, status, patient_id) VALUES ($1, $2, $3, $4)`,
          [wardId, `${w.type.charAt(0)}${i}`, status, pId]
        );
      }
    }
    console.log('✅ Wards and Beds seeded');

    // --- BLOOD BANK ---
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    for (const bg of bloodGroups) {
      await client.query(
        `INSERT INTO blood_bank (blood_group, units_available) VALUES ($1, $2)`,
        [bg, Math.floor(Math.random() * 20)]
      );
    }
    console.log('✅ Blood Bank seeded');

    // --- AMBULANCE ---
    await client.query(
      `INSERT INTO ambulance_requests (patient_name, phone, pickup_address, status, driver_name, vehicle_number)
       VALUES ('Emergency Patient', '9999888877', '123 Main St', 'DISPATCHED', 'Driver Dave', 'AMB-101')`
    );
    console.log('✅ Ambulance Requests seeded');

    // --- FEEDBACK & REVIEWS ---
    const feedbackReviews = [
      { rating: 5, review: 'Excellent doctor, very patient and kind.' },
      { rating: 4, review: 'Good consultation, but had to wait 15 mins.' },
      { rating: 5, review: 'The facilities are top notch. Highly recommended.' },
      { rating: 5, review: 'Accurate diagnosis and friendly staff.' },
      { rating: 4, review: 'Satisfied with the treatment.' },
      { rating: 5, review: 'Great experience, feeling much better now.' },
      { rating: 3, review: 'Average experience, the doctor seemed rushed.' },
      { rating: 5, review: 'Very knowledgeable and professional.' },
      { rating: 4, review: 'Good treatment but the clinic was too crowded.' },
      { rating: 5, review: 'Best doctor in the city!' },
      { rating: 5, review: 'Highly experienced and very gentle.' },
      { rating: 4, review: 'Took time to explain the issue properly.' }
    ];
    for (let i = 0; i < aptIds.length; i++) {
       const rev = feedbackReviews[i % feedbackReviews.length];
       if (aptIds[i]) {
           await client.query(`
             INSERT INTO feedback (patient_id, doctor_id, appointment_id, rating, review)
             VALUES ($1, $2, $3, $4, $5)
          `, [patientIds[i % patientIds.length], doctorIds[i % doctorIds.length], aptIds[i], rev.rating, rev.review]);
       }
    }
    console.log('✅ Feedback & Reviews seeded');
    
    // --- AUDIT LOGS ---
    for (let i = 0; i < 20; i++) {
        await client.query(`
           INSERT INTO audit_logs (user_id, action, details, ip_address)
           VALUES ($1, $2, $3, $4)
        `, [adminUser.rows[0].id, 'SYSTEM_EVENT', `Simulated historical event ${i}`, '127.0.0.1']);
    }
    console.log('✅ Audit Logs seeded');

    // Restore custom users
    for (const u of customUsers) {
      await client.query(`
        INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, profile_image_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [u.id, u.email, u.password_hash, u.role, u.first_name, u.last_name, u.phone, u.profile_image_url, u.created_at]);
      
      const p = customPatients.find(pat => pat.user_id === u.id);
      if (p) {
        await client.query(`
          INSERT INTO patients (id, user_id, patient_id, dob, gender, blood_group, allergies, chronic_diseases, emergency_contact_name, emergency_contact_phone, address, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [p.id, p.user_id, p.patient_id, p.dob, p.gender, p.blood_group, p.allergies, p.chronic_diseases, p.emergency_contact_name, p.emergency_contact_phone, p.address, p.created_at]);
      }
    }
    if (customUsers.length > 0) {
      console.log(`✅ Restored ${customUsers.length} existing user accounts`);
    }

    await client.query('COMMIT');
    console.log('\nSeed completed successfully!\n');
    console.log('Demo Credentials:');
    console.log('  Admin:      admin@hospital.com    / Password123!');
    console.log('  Doctor:     doctor1@hospital.com  / Password123!');
    console.log('  Reception:  reception1@hospital.com / Password123!');
    console.log('  Patient:    patient@example.com   / Password123!');
    console.log('  Lab:        lab1@hospital.com     / Password123!');
    console.log('  Pharmacy:   pharmacy1@hospital.com / Password123!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

runSeed();
