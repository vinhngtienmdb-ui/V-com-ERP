import fs from 'fs';
let code = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8');

// 1. Add states
const stateInjection = ` const [activeTab, setActiveTab] = useState('labor');
 const [contracts, setContracts] = useState(MOCK_CONTRACTS);
 const [selectedContract, setSelectedContract] = useState<any>(null);
 const [signingModalOpen, setSigningModalOpen] = useState(false);
 const [newComment, setNewComment] = useState('');
 const navigate = useNavigate();

 const handleStatusChange = (id: string, newStatus: string) => {
   if (window.confirm('Bạn có chắc chắn muốn thực hiện hành động này?')) {
     setContracts(contracts.map(c => c.id === id ? { ...c, status: newStatus } : c));
     if (selectedContract?.id === id) {
       setSelectedContract({ ...selectedContract, status: newStatus });
     }
   }
 };

 const handleAddComment = () => {
   if (!newComment.trim() || !selectedContract) return;
   const commentObj = {
     id: Date.now(),
     author: 'Tôi (Đang đăng nhập)',
     time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' }),
     content: newComment.trim()
   };
   
   const updatedContracts = contracts.map(c => 
     c.id === selectedContract.id 
       ? { ...c, comments: [...(c.comments || []), commentObj] } 
       : c
   );
   
   setContracts(updatedContracts);
   setSelectedContract({ ...selectedContract, comments: [...(selectedContract.comments || []), commentObj] });
   setNewComment('');
 };`;

code = code.replace(/ const \[activeTab, setActiveTab\] = useState\('labor'\);\n const \[selectedContract, setSelectedContract\] = useState<any>\(null\);\n const \[signingModalOpen, setSigningModalOpen\] = useState\(false\);\n const navigate = useNavigate\(\);/, stateInjection);

// 2. Add action buttons interaction
code = code.replace(
  /<button className="w-full px-4 py-2 bg-emerald-600 text-white rounded font-bold text-sm hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2">/,
  '<button onClick={() => handleStatusChange(selectedContract.id, "active")} className="w-full px-4 py-2 bg-emerald-600 text-white rounded font-bold text-sm hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2">'
);
code = code.replace(
  /<button className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded font-bold text-sm hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">/,
  '<button onClick={() => handleStatusChange(selectedContract.id, "returned")} className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded font-bold text-sm hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">'
);
code = code.replace(
  /<button className="w-full px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded font-bold text-sm hover:bg-red-100 shadow-sm flex items-center justify-center gap-2">/,
  '<button onClick={() => handleStatusChange(selectedContract.id, "rejected")} className="w-full px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded font-bold text-sm hover:bg-red-100 shadow-sm flex items-center justify-center gap-2">'
);

// 3. Comment input interaction
code = code.replace(
  /<textarea \n           rows=\{2\}\n           placeholder="Nhập góp ý, ghi chú để yêu cầu sửa đổi..."\n           className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none pr-12 bg-slate-50 focus:bg-white"\n         ><\/textarea>/,
  '<textarea \n           rows={2}\n           value={newComment}\n           onChange={(e) => setNewComment(e.target.value)}\n           placeholder="Nhập góp ý, ghi chú để yêu cầu sửa đổi..."\n           className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none pr-12 bg-slate-50 focus:bg-white"\n         />'
);

code = code.replace(
  /<button className="absolute bottom-2 right-2 p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">/,
  '<button onClick={handleAddComment} className="absolute bottom-2 right-2 p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">'
);

// 4. Also use contracts state mapped in the table instead of MOCK_CONTRACTS directly.
code = code.replace(
  /\{MOCK_CONTRACTS\.filter/,
  '{contracts.filter'
);

// 5. Update Status badge in table to include "returned" and "rejected"
code = code.replace(
  /doc\.status === 'expiring_soon' \? "bg-orange-50 text-blue-600" : "bg-red-50 text-red-600"/,
  'doc.status === "expiring_soon" ? "bg-orange-50 text-blue-600" : doc.status === "returned" ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-600"'
);

code = code.replace(
  /\{doc\.status === 'expired' && <AlertCircle className="w-3 h-3" \/>\}/,
  '{doc.status === "expired" || doc.status === "rejected" ? <AlertCircle className="w-3 h-3" /> : null}\n {doc.status === "returned" && <CornerDownRight className="w-3 h-3" />}'
);

code = code.replace(
  /doc\.status === 'expiring_soon' \? 'Sắp hết hạn' : 'Hết hạn'\}/,
  'doc.status === "expiring_soon" ? "Sắp hết hạn" : doc.status === "returned" ? "Trả lại" : doc.status === "rejected" ? "Từ chối" : "Hết hạn"}'
);

fs.writeFileSync('src/components/ContractManager.tsx', code);
