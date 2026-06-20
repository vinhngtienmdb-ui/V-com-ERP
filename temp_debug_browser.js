import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('Finding system browser...');
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  
  let executablePath = '';
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      console.log(`Found browser at: ${p}`);
      break;
    }
  }

  if (!executablePath) {
    console.error('Could not find any system browser (Chrome/Edge)!');
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Collect logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`[Console ${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    logs.push(`[Page Error] ${err.toString()}`);
  });
  page.on('requestfailed', request => {
    logs.push(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`);
  });

  const artifactDir = 'C:\\Users\\vinhn\\.gemini\\antigravity\\brain\\1b6b94e2-e93f-446e-a263-b71a47b3375d';

  // Test 3003
  console.log('Navigating to http://localhost:3003 (Seller Centre)...');
  try {
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle2', timeout: 15000 });
    console.log('Wait 5s...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_3003_fixed.png'), fullPage: true });
    console.log('Saved screenshot_3003_fixed.png');
  } catch (err) {
    console.error('Error navigating to 3003:', err.message);
  }

  // Print logs for 3003
  console.log('\n--- BROWSER LOGS FOR 3003 ---');
  logs.forEach(log => console.log(log));
  logs.length = 0; // Clear logs for next page

  // Test 3004
  console.log('\nNavigating to http://localhost:3004 (iPOS)...');
  try {
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle2', timeout: 15000 });
    console.log('Wait 5s...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_3004_fixed.png'), fullPage: true });
    console.log('Saved screenshot_3004_fixed.png');
  } catch (err) {
    console.error('Error navigating to 3004:', err.message);
  }

  // Print logs for 3004
  console.log('\n--- BROWSER LOGS FOR 3004 ---');
  logs.forEach(log => console.log(log));

  await browser.close();
  console.log('Done!');
}

run();
