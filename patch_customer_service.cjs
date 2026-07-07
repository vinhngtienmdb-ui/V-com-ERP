const fs = require('fs');

let path = 'src/components/CustomerService.tsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  
  // 1. Add import OmniChat if not exists
  if (!content.includes('import { OmniChat }')) {
    content = content.replace(/import { Modal } from '.\/ui\/Modal';/, "import { Modal } from './ui/Modal';\nimport { OmniChat } from './OmniChat';");
  }
  
  // 2. Change default activeTab from 'dashboard' to 'chat'
  content = content.replace(/const \[activeTab, setActiveTab\] = useState<any>\('dashboard'\);/, "const [activeTab, setActiveTab] = useState<any>('chat');");
  
  // 3. Replace the chat tab content with <OmniChat />
  // The chat tab content is roughly from line 968 to line 1284.
  // We can use a regex to replace everything between {activeTab === 'chat' && ( and )} right before {activeTab === 'calls'
  const chatRegex = /\{activeTab === 'chat' && \([\s\S]*?\)\}[\s\n]*\{activeTab === 'calls' && \(/;
  content = content.replace(chatRegex, "{activeTab === 'chat' && (\n  <div className=\"mt-4\">\n    <OmniChat />\n  </div>\n)}\n\n{activeTab === 'calls' && (");
  
  fs.writeFileSync(path, content, 'utf8');
  console.log("CustomerService.tsx patched");
}
