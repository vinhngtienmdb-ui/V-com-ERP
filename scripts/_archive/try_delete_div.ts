import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
const originalContent = fs.readFileSync(settingsPath, 'utf8');

function testCompile(): boolean {
  try {
    execSync('npx tsc --noEmit', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

console.log('Testing initial compile status...');
if (testCompile()) {
  console.log('✓ App already compiles successfully!');
  process.exit(0);
}

// Strategy A: Remove the third </div> from showFeeModal at line 2779
console.log('Trying Strategy A: Remove one </div> from the bottom modal...');
let lines = originalContent.split('\n');
// Let's look around line 2770-2782 for </div>
let foundIdx = -1;
for (let i = lines.length - 30; i < lines.length; i++) {
  if (lines[i] && lines[i].includes('</div>') && lines[i+1]?.includes('</div>') && lines[i+2]?.includes('</div>')) {
    foundIdx = i;
    break;
  }
}

if (foundIdx !== -1) {
  console.log(`Found three consecutive closing divs starting at line ${foundIdx + 1}`);
  const testLines = [...lines];
  testLines.splice(foundIdx, 1); // remove one </div>
  fs.writeFileSync(settingsPath, testLines.join('\n'), 'utf8');
  if (testCompile()) {
    console.log('✓ SUCCESS with Strategy A! One </div> removed.');
    process.exit(0);
  } else {
    console.log('Strategy A failed. Restoring original file...');
    fs.writeFileSync(settingsPath, originalContent, 'utf8');
  }
} else {
  console.log('Three consecutive divs at the bottom were not found.');
}

// Strategy B: Trace where the extra div is and fix it recursively
console.log('Running sequential extra div cleanup...');
// Let's see if we can find any other three consecutive divs inside the modal blocks and try removing one
lines = originalContent.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i]?.includes('</div>') && lines[i+1]?.includes('</div>') && lines[i+2]?.includes('</div>') && lines[i+3]?.includes('</div>')) {
    console.log(`Found 4 consecutive divs starting at line ${i + 1}`);
    const testLines = [...lines];
    testLines.splice(i, 1);
    fs.writeFileSync(settingsPath, testLines.join('\n'), 'utf8');
    if (testCompile()) {
      console.log(`✓ SUCCESS! Removed one of the 4 consecutive divs at line ${i + 1}`);
      process.exit(0);
    }
    // Restore
    fs.writeFileSync(settingsPath, originalContent, 'utf8');
  }
}

console.log('Self-hearing attempts completed. Let\'s check manual diagnostics.');
fs.writeFileSync(settingsPath, originalContent, 'utf8');
