const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: path.resolve(__dirname, 'downloads')
  });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'patient1@example.com');
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => document.body.innerText.includes('Patient Dashboard') || document.body.innerText.includes('Welcome'), { timeout: 10000 }).catch(() => {});
    
    await page.goto('http://localhost:5173/patient/appointments/book', { waitUntil: 'networkidle0' });

    console.log('Waiting for doctor selection...');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        const doctorDiv = divs.find(d => d.className.includes('cursor-pointer') && d.innerText.includes('Dr.'));
        if (doctorDiv) doctorDiv.click();
    });
    console.log('Doctor clicked');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.evaluate(() => document.querySelector('input[name="appointment_date"]').value = '');
    await page.type('input[name="appointment_date"]', dateStr);
    
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const timeBtn = btns.find(b => b.textContent.includes('10:00') && !b.disabled);
        if (timeBtn) timeBtn.click();
    });
    console.log('Time clicked');
    
    await page.type('textarea[name="symptoms"]', 'Headache');
    
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const submitBtn = btns.find(b => b.textContent.includes('Continue to secure payment'));
        if (submitBtn) submitBtn.click();
    });
    console.log('Form submitted');

    console.log('Waiting for modal...');
    await page.waitForFunction(() => document.body.innerText.includes('Confirm your appointment'), { timeout: 10000 });
    
    console.log('Clicking Pay...');
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const payBtn = btns.find(b => b.textContent.includes('Pay and confirm'));
        if (payBtn) payBtn.click();
    });

    console.log('Waiting for success...');
    await page.waitForFunction(() => document.body.innerText.includes('Payment received'), { timeout: 10000 });
    console.log('Success visible!');
    
    await new Promise(r => setTimeout(r, 4000));
    
    const dlPath = path.resolve(__dirname, 'downloads');
    if (fs.existsSync(dlPath)) {
       console.log('Downloads:', fs.readdirSync(dlPath));
    } else {
       console.log('No downloads folder created');
    }

    console.log('END TO END SUCCESS');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
