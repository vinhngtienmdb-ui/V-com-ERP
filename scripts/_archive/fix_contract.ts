import fs from 'fs';
let code = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8');

const updatedMock = `const MOCK_CONTRACTS = [
 { id: 'HDLD-001', title: 'Hợp đồng lao động - Nguyễn Văn A', type: 'labor', subtype: 'Chính thức', status: 'active', party: 'Nguyễn Văn A', expiry: '01/01/2025', value: '-', signatureStatus: 'signed', signers: [{role: 'Người sử dụng lao động', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Nguyễn Văn A', status: 'signed'}], file: { name: 'HDLD_NguyenVanA.docx', type: 'docx' }, comments: [ { id: 1, author: 'Nhân sự', time: '10:00 01/02', content: 'Đã cập nhật phụ lục đính kèm.' } ] },
 { id: 'HDTV-002', title: 'Hợp đồng thử việc - Trần Thái B', type: 'labor', subtype: 'Thử việc', status: 'expiring_soon', signatureStatus: 'signed', party: 'Trần Thái B', expiry: '10/05/2024', value: '-', signers: [{role: 'Người sử dụng ND', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Trần Thái B', status: 'signed'}], file: { name: 'HDTV_TranThaiB_v2.pdf', type: 'pdf' }, comments: [] },
 { id: 'HDMB-001', title: 'Hợp đồng mua bán thiết bị VP', type: 'sales', subtype: 'Mua bán', status: 'pending', signatureStatus: 'pending', party: 'Công ty ABC', expiry: '31/12/2024', value: '50,000,000 ₫', signers: [{role: 'Bên mua', name: 'Giám đốc', status: 'pending'}, {role: 'Bên bán', name: 'Đại diện bên bán', status: 'pending'}], file: { name: 'HDMB_ThietBi_VP.xlsx', type: 'xlsx' }, comments: [ { id: 2, author: 'Kế toán', time: '09:15 10/05', content: 'Nhờ xem lại điều khoản thanh toán mục 3.2.' } ] },
 { id: 'HDDV-001', title: 'Hợp đồng tư vấn AI', type: 'service', subtype: 'Dịch vụ', status: 'expired', signatureStatus: 'signed', party: 'AI Partner LLC', expiry: '01/02/2024', value: '120,000,000 ₫', signers: [{role: 'Bên thuê', name: 'Giám đốc', status: 'signed'}, {role: 'Bên tư vấn', name: 'AI Partner LLC', status: 'signed'}], file: { name: 'HDDV_AI_Partner.pptx', type: 'pptx' }, comments: [] }
];`;
code = code.replace(/const MOCK_CONTRACTS = \[[\s\S]*?\];/, updatedMock);

if (!code.includes('MessageSquare')) {
    code = code.replace(/import { \n/, "import { \n MessageSquare, Send, File, Download, Reply,\n  CornerDownRight, XCircle,\n");
}

fs.writeFileSync('src/components/ContractManager.tsx', code);
