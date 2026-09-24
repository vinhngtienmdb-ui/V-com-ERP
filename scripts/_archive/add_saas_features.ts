import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
const saasLayoutPath = path.join(process.cwd(), 'saas_layout.txt');

if (!fs.existsSync(settingsPath)) {
  console.error('Settings.tsx does not exist.');
  process.exit(1);
}

if (!fs.existsSync(saasLayoutPath)) {
  console.error('saas_layout.txt does not exist.');
  process.exit(1);
}

let settingsContent = fs.readFileSync(settingsPath, 'utf8');
const saasLayout = fs.readFileSync(saasLayoutPath, 'utf8');

console.log('Original Settings.tsx read. length:', settingsContent.length);

// 1. Upgrade activeTab union type (robust replacement using regex)
const unionRegex = /const\s+\[activeTab,\s*setActiveTab\]\s*=\s*useState<('overview'[^>]+)>/;
const matchUnion = settingsContent.match(unionRegex);

if (matchUnion) {
  const currentUnion = matchUnion[1];
  if (!currentUnion.includes('saas_subscription')) {
    const updatedUnion = currentUnion + " | 'saas_subscription'";
    settingsContent = settingsContent.replace(currentUnion, updatedUnion);
    console.log('✓ Updated activeTab state type with saas_subscription.');
  } else {
    console.log('activeTab type already contains saas_subscription.');
  }
} else {
  console.error('✘ Failed to parse activeTab useState declaration.');
}

// 2. Add SaaS & Subscriptions to the SETTINGS_MODULE_GROUPS
// We look for { id: 'comms', label: 'Tích hợp Kênh', ... } and insert saas_subscription right after it
const commsRegex = /(\{\s*id:\s*'comms'[\s\S]*?color:\s*'cyan'\s*\},?)/;
if (settingsContent.match(commsRegex)) {
  const saasItem = `\n\t{ id: 'saas_subscription', label: 'Quản lý SaaS', icon: ShieldCheck, desc: 'Giấy phép thuê bao SaaS, hạn mức tài nguyên hệ thống, dữ liệu cô lập và hóa đơn', color: 'emerald' },`;
  settingsContent = settingsContent.replace(commsRegex, `$1${saasItem}`);
  console.log('✓ SaaS & Subscriptions added to SETTINGS_MODULE_GROUPS.');
} else {
  console.error('✘ Failed to locate comms block in module groups.');
}

// 3. Add SaaS breadcrumb/header info
const inventoryBreadcrumbRegex = /(\{\s*id:\s*'inventory',\s*label:\s*'Hàng hóa & Kho',\s*icon:\s*Package\s*\},?)/;
if (settingsContent.match(inventoryBreadcrumbRegex)) {
  const saasItemBreadcrumb = `\n\t\t{ id: 'saas_subscription', label: 'Cấu hình SaaS & Đăng ký', icon: ShieldCheck },`;
  settingsContent = settingsContent.replace(inventoryBreadcrumbRegex, `$1${saasItemBreadcrumb}`);
  console.log('✓ Added saas_subscription to header breadcrumb filter array.');
} else {
  console.error('✘ Failed to find inventory breadcrumb entry.');
}

// 4. Inject the layout blocks: append saasLayout inside settingsContent right after the activeTab === 'inventory' conditional render block.
// The inventory block looks like: {activeTab === 'inventory' && ( ... )}
// Let's locate the pattern "activeTab === 'inventory' && (" and find its matched closing brackets `}` or block.
const inventoryBlockStart = settingsContent.indexOf("activeTab === 'inventory'");
if (inventoryBlockStart !== -1) {
  // Let's search for the first ")}" that closes the inventory render block.
  // We can find the closing pattern. We saw:
  // 2225:  </div>
  // 2226:  </div>
  // 2227:  )}
  const substringFromInv = settingsContent.substring(inventoryBlockStart);
  const closingRelativeIndex = substringFromInv.indexOf(')}');
  if (closingRelativeIndex !== -1) {
    const endOfInvBlock = inventoryBlockStart + closingRelativeIndex + 2; // right after ")}"
    
    // Check if saas_subscription layout is already present
    if (!settingsContent.includes("activeTab === 'saas_subscription'")) {
      const beforeStr = settingsContent.substring(0, endOfInvBlock);
      const afterStr = settingsContent.substring(endOfInvBlock);
      settingsContent = beforeStr + '\n' + saasLayout + '\n' + afterStr;
      console.log('✓ Injected saas_subscription layout block into settings content.');
    } else {
      console.log('saas_subscription layout is already present in Settings.tsx.');
    }
  } else {
    console.error('✘ Could not find closing pattern of activeTab === inventory.');
  }
} else {
  console.error('✘ Could not locate activeTab === inventory block.');
}

// Write the compiled file back
fs.writeFileSync(settingsPath, settingsContent, 'utf8');
console.log('✓ Settings.tsx successfully updated!');
