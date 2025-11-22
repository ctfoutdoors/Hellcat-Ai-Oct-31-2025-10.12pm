import puppeteer from 'puppeteer';

console.log('[Puppeteer Test] Starting Chrome launch test...');

try {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });
  
  console.log('[Puppeteer Test] ✅ Chrome launched successfully!');
  
  const page = await browser.newPage();
  await page.goto('https://www.fedex.com/fedextrack/?trknbr=394733401787');
  
  console.log('[Puppeteer Test] ✅ Page loaded successfully!');
  
  const title = await page.title();
  console.log('[Puppeteer Test] Page title:', title);
  
  await browser.close();
  console.log('[Puppeteer Test] ✅ Test complete!');
  
} catch (error) {
  console.error('[Puppeteer Test] ❌ Error:', error.message);
  process.exit(1);
}
