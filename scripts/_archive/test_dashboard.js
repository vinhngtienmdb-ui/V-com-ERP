import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  // Bypass auth by setting localStorage and injecting a test session if needed,
  // or we can just render the Dashboard component in memory.
  // Actually, wait, let's look at `Dashboard` file to spot the bug.
  await browser.close();
})();
