import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log(e));
  
  await page.screenshot({ path: 'screenshot.png' });
  const html = await page.content();
  fs.writeFileSync('output.html', html);
  
  await browser.close();
})();
