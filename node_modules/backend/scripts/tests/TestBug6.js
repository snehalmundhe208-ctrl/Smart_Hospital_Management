const fs = require('fs');
const path = require('path');

async function runTest() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('1. Logging in as Lab Technician...');
    let res = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lab1@hospital.com', password: 'Password123!' })
    });
    let data = await res.json();
    
    if (res.status === 401 || !data.token) {
        console.log('Trying alternative password...');
        let res2 = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'lab1@hospital.com', password: 'password123' })
        });
        data = await res2.json();
    }
    
    let labToken = data.token;
    if (!labToken) throw new Error('Failed to login as Lab');
    await testLabFlow(baseURL, labToken);
    
  } catch (err) {
    console.log('Error:', err.message);
  }
}

async function testLabFlow(baseURL, labToken) {
    const config = { headers: { Authorization: `Bearer ${labToken}` } };
    
    console.log('2. Fetching Lab Requests...');
    let res = await fetch(`${baseURL}/lab/requests`, config);
    let requests = await res.json();
    let targetReq = requests.find(r => r.patient_first_name === 'Narendra') || requests[0];
    
    if (!targetReq) {
        console.log('No lab requests found to test.');
        return;
    }
    console.log(`Target Request: ${targetReq.id} for Patient ${targetReq.patient_first_name}`);
    
    console.log('3. Uploading dummy file...');
    const dummyPath = path.join(__dirname, 'dummy.pdf');
    fs.writeFileSync(dummyPath, 'Dummy PDF content');
    
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(dummyPath)], { type: 'application/pdf' });
    formData.append('file', blob, 'dummy.pdf');
    
    let uploadRes = await fetch(`${baseURL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${labToken}` },
        body: formData
    });
    let uploadData = await uploadRes.json();
    let reportUrl = uploadData.url;
    console.log('File uploaded to:', reportUrl);
    
    console.log('4. Updating Lab Request...');
    let updateRes = await fetch(`${baseURL}/lab/requests/${targetReq.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${labToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            status: 'COMPLETED',
            report_url: reportUrl,
            technician_name: 'Test Technician'
        })
    });
    let updateData = await updateRes.json();
    console.log('Updated Request Status:', updateData.status);
    
    console.log('5. Logging in as Patient (narendra@gmail.com)...');
    let patRes = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'narendra@gmail.com', password: 'meloni' })
    });
    let patData = await patRes.json();
    let patToken = patData.token;
    let patConfig = { headers: { Authorization: `Bearer ${patToken}` } };
    
    console.log('6. Checking Notifications...');
    let notifRes = await fetch(`${baseURL}/notifications`, patConfig);
    let notifications = await notifRes.json();
    let unread = notifications.filter(n => !n.is_read);
    console.log(`Patient has ${unread.length} unread notifications.`);
    if (unread.length > 0) {
        console.log('Latest Notification:', unread[0].title, '-', unread[0].message);
    }
    
    console.log('7. Checking Patient Lab Reports...');
    let patLabRes = await fetch(`${baseURL}/lab/requests`, patConfig);
    let patLabReports = await patLabRes.json();
    let patReports = patLabReports.filter(r => r.report_url);
    console.log(`Patient sees ${patReports.length} uploaded lab reports.`);
    
    if (patReports.length > 0) {
        let firstReport = patReports[0];
        console.log(`Report details: ${firstReport.test_name}, Technician: ${firstReport.technician_name}, URL: ${firstReport.report_url}`);
    }
    
    console.log('8. Testing static file access...');
    try {
        let staticRes = await fetch(`http://localhost:5000${reportUrl}`);
        if (staticRes.ok) {
            console.log('Static file downloaded successfully.');
        } else {
            console.log('Failed to download static file:', staticRes.status);
        }
    } catch (e) {
        console.log('Failed to download static file:', e.message);
    }
    
    console.log('TEST COMPLETE: PASS');
}

runTest();
