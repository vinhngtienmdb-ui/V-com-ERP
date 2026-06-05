import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
let content = fs.readFileSync(settingsPath, 'utf8');

const targetWord = "Phương pháp Quản lý Kho";
const searchSegment = content.indexOf(targetWord);

if (searchSegment !== -1) {
  console.log('✓ Found segment index:', searchSegment);
  
  // Find preceding "<div" which opens the parent container of the duplicate method block
  const precedingDiv = content.lastIndexOf('<div', searchSegment);
  console.log('Preceding div index:', precedingDiv);
  
  // Find succeeding closing tab construct "  )}" before {showAddJobTitleModal
  const succeedingModal = content.indexOf('{showAddJobTitleModal', searchSegment);
  console.log('Succeeding modal index:', succeedingModal);

  const precedingClose = content.lastIndexOf(')}', succeedingModal);
  console.log('Preceding close index:', precedingClose);

  if (precedingDiv !== -1 && precedingClose !== -1) {
    const endPoint = precedingClose + 2; // right after ")}"
    
    const head = content.substring(0, precedingDiv);
    const tail = content.substring(endPoint);
    
    content = head + tail;
    console.log('✓ Successfully sliced duplicate inventory block!');
  } else {
    console.error('✘ Could not identify boundary indices for slice.');
  }
} else {
  console.log('Duplicate block was not found.');
}

fs.writeFileSync(settingsPath, content, 'utf8');
console.log('Cleanup completed.');
