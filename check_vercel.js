const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('VERCEL PAGE LOG ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('VERCEL PAGE ERROR:', error.message);
  });

  page.on('requestfailed', request => {
    console.log('VERCEL REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  try {
    await page.goto('https://pocc-frontend.vercel.app/pages', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('Vercel page loaded.');
    
    // Check if body is empty or has a specific error class
    const html = await page.content();
    if (html.includes('var(--vz-body-bg)')) {
        console.log('Page contains body background.');
    }
    
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML.substring(0, 200));
    console.log('Root HTML snippet:', rootHtml);
    
  } catch (e) {
    console.log('Navigation failed:', e.message);
  }

  await browser.close();
})();
