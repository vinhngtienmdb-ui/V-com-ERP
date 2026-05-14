import fs from 'fs';
let code = fs.readFileSync('src/components/RequestHub.tsx', 'utf-8');

// Replace signature enum
code = code.replace(/useState<'smart_ca' \| 'viettel_ca' \| 'usb_token'>\('smart_ca'\)/, "useState<'company_ca' | 'personal_ca' | 'personal_image'>('company_ca')");

// Replace the signature grid options
const oldGridOptions = `[
 { id: 'smart_ca', label: 'VNPT SmartCA', desc: 'Remote Signing', color: 'blue' },
 { id: 'viettel_ca', label: 'Viettel-CA', desc: 'Cloud Token', color: 'rose' },
 { id: 'usb_token', label: 'USB Token', desc: 'Ký bằng thiết bị vật lý', color: 'slate' }
 ]`;

const newGridOptions = `[
 { id: 'company_ca', label: 'CA Công ty', desc: 'Chữ ký CA Doanh nghiệp', color: 'blue' },
 { id: 'personal_ca', label: 'CA Cá nhân', desc: 'Chứng thư của NCC', color: 'emerald' },
 { id: 'personal_image', label: 'Chữ ký ảnh', desc: 'Văn bản nội bộ', color: 'slate' }
 ]`;

code = code.replace(oldGridOptions, newGridOptions);

// Clean up inline showConfigModal disabled code
const inlineDisabledRegex = /\{false && \(\n\s*<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900\/50 backdrop-blur-sm">[\s\S]*?Lưu cấu hình\n\s*<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/;

if(inlineDisabledRegex.test(code)) {
    code = code.replace(inlineDisabledRegex, '{/* Removed hidden old inline modal */}');
    console.log("Removed inline modal");
}

fs.writeFileSync('src/components/RequestHub.tsx', code);
