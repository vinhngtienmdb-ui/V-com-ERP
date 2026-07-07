const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerService.tsx', 'utf8');

// Remove MOCK_THREADS from CustomerService
content = content.replace(/const MOCK_THREADS: ChatThread\[\] = \[\s*[\s\S]*?\];/g, "");

// Replace activeThreadId logic
content = content.replace(/const activeThread = MOCK_THREADS\.find\(t => t\.id === activeThreadId\);/g, "const activeThread = null;");
content = content.replace(/activeThread\?\.channel \|\| 'zalo'/g, "'zalo'");

// Remove simulateNewTicket logic completely
content = content.replace(/const simulateNewTicket = \(\) => \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?setSuccessToast\(null\);[\s\S]*?\}, 4000\);\s*\}, 800\);\s*\};/g, "");

// Remove handleSimulateAiReply
content = content.replace(/const handleSimulateAiReply = \(\) => \{[\s\S]*?\}, 1500\);\s*\};/g, "");

fs.writeFileSync('src/components/CustomerService.tsx', content, 'utf8');
console.log('CustomerService patched');
