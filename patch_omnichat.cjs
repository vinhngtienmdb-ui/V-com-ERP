const fs = require('fs');

let path = 'src/components/OmniChat.tsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Fix generateDraft crashing on response.split
  const oldDraft = "const suggestions = response.split('\\n').filter(s => s.trim().length > 5).slice(0, 3);";
  const newDraft = "const suggestions = response ? response.split('\\n').filter((s: any) => s.trim().length > 5).slice(0, 3) : ['Dạ vâng, bên em sẽ kiểm tra ngay ạ.', 'Xin chào, tôi có thể hỗ trợ gì cho bạn?', 'Cảm ơn bạn đã liên hệ.'];";
  
  if (content.includes(oldDraft)) {
    content = content.replace(oldDraft, newDraft);
    fs.writeFileSync(path, content, 'utf8');
    console.log("OmniChat.tsx patched for generateDraft");
  } else {
    console.log("oldDraft not found");
  }
}
