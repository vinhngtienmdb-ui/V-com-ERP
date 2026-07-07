const fs = require('fs');
let content = fs.readFileSync('src/components/OmniChat.tsx', 'utf8');

// Fix property access
content = content.replace(/m\.senderId === 'user'/g, "m.message_type === 0");
content = content.replace(/\?\.text/g, "?.content");
content = content.replace(/msg\.text/g, "msg.content");
content = content.replace(/msg\.senderId === 'user'/g, "msg.message_type === 0");

fs.writeFileSync('src/components/OmniChat.tsx', content, 'utf8');
console.log('OmniChat fixed');
