const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/prescriptions') && response.request().method() === 'POST') {
      console.log('API /api/prescriptions RESPONSE STATUS:', response.status());
      try {
        console.log('API RESPONSE BODY:', await response.json());
      } catch(e) {
        console.log('API RESPONSE TEXT:', await response.text());
      }
    }
  });

  page.on('dialog', async dialog => {
    console.log('ALERT SHOWED:', dialog.message());
    await dialog.dismiss();
  });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5175/login');
    await page.type('input[type="email"]', 'doctor1@hospital.com');
    await page.type('input[type="password"]', 'doctor123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    console.log('Logged in!');
    
    // go to appointments
    await page.goto('http://localhost:5175/doctor/appointments', { waitUntil: 'domcontentloaded' });
    
    // click the first "Generate Report & Complete" button
    console.log('Clicking generate report button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('Generate Report'));
      if (btn) btn.click();
    });
    
    // wait for modal
    await page.waitForTimeout(1000);
    
    // type diagnosis
    console.log('Typing diagnosis...');
    await page.type('input[placeholder="e.g. Acute Bronchitis"]', 'Test Diagnosis');
    
    // click submit
    console.log('Submitting form...');
    await page.click('button[form="report-form"]');
    
    await page.waitForTimeout(3000);
    console.log('Done!');
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}
run();
