const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Listen to console and network
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('requestfailed', request => console.error('BROWSER NETWORK FAILED:', request.url(), request.failure().errorText));
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      console.log('API Response:', response.url(), response.status());
    }
  });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Login
    await page.type('input[type="email"]', 'patient1@example.com');
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for navigation after login...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Go to pharmacy store
    console.log('Navigating to pharmacy store...');
    await page.goto('http://localhost:5173/patient/medicines', { waitUntil: 'networkidle2' });
    
    // Wait for medicines to load
    await page.waitForSelector('button.bg-emerald-50'); // Add to cart button or similar
    
    // Click the first "Add to Cart" or "Buy Now" equivalent
    const addBtn = await page.$('button.bg-primary-50, button.bg-emerald-50');
    if (addBtn) {
      await addBtn.click();
      console.log('Added to cart');
    } else {
      console.log('No add to cart button found');
    }
    
    // Click cart icon to open checkout
    const cartIcon = await page.$('button.bg-emerald-50'); // Usually the cart icon
    // Actually let's just evaluate in page to find the cart
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cartBtn = btns.find(b => b.textContent.includes('Items') || b.innerHTML.includes('ShoppingCart'));
      if (cartBtn) cartBtn.click();
    });
    console.log('Opened cart');
    
    // Click Checkout
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const checkoutBtn = btns.find(b => b.textContent.includes('Proceed to Checkout') || b.textContent.includes('Checkout'));
      if (checkoutBtn) checkoutBtn.click();
    });
    console.log('Clicked Proceed to Checkout');
    
    // Click Pay
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const payBtn = btns.find(b => b.textContent.includes('Pay $'));
      if (payBtn) payBtn.click();
    });
    console.log('Clicked Pay');
    
    // Wait 5 seconds to observe console/network
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('Current URL:', page.url());
    
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
