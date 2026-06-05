import fs from 'fs';
let code = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8');

const UI_BLOCK = ` {selectedContract && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in p-4" onClick={() => setSelectedContract(null)}>
 <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
 <div>
 <h3 className="text-lg font-bold text-slate-900">{selectedContract.title}</h3>
 <p className="text-xs font-mono text-slate-500 mt-0.5"><span className="uppercase font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{selectedContract.subtype || selectedContract.type}</span> • {selectedContract.id}</p>
 </div>
 <div className="flex items-center gap-2">
 {selectedContract.file && (
   <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-sm">
     <Download className="w-4 h-4" /> Tải tệp ({selectedContract.file.type})
   </button>
 )}
 <button 
 onClick={() => setSelectedContract(null)}
 className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-2"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>
 
 <div className="flex flex-1 overflow-hidden">
  {/* Left Panel: Document Viewer */}
  <div className="flex-1 bg-slate-100/50 border-r border-slate-200 flex flex-col relative">
    {selectedContract.file ? (
      <div className="flex-1 overflow-auto bg-[#e5e7eb] p-8 flex justify-center">
        {/* Mock Document Render */}
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-[20mm]  mx-auto relative origin-top max-w-full">
           <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 px-2 py-1 text-[10px] font-bold rounded uppercase">
              Preview: {selectedContract.file.name}
           </div>
           
           <div className="space-y-6 text-sm text-slate-800 leading-relaxed mt-12 font-serif">
             <h1 className="text-2xl font-bold text-center mb-8 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/><span className="text-lg">Độc lập - Tự do - Hạnh phúc</span></h1>
             <h2 className="text-xl font-bold text-center mt-12 mb-8">{selectedContract.title.split('-')[0].toUpperCase()}</h2>
             <p className="text-right italic">Hà Nội, ngày ... tháng ... năm ...</p>
             <p>Căn cứ các văn bản pháp luật hiện hành và sự thỏa thuận của hai bên.</p>
             <p>Hôm nay, chúng tôi gồm có:</p>
             <div className="pl-4 border-l-2 border-slate-300 space-y-2">
                <p><strong>Bên A:</strong> {selectedContract.signers?.[0]?.name || 'Công ty CP Giải pháp Công nghệ'}</p>
                <p><strong>Bên B:</strong> {selectedContract.party}</p>
             </div>
             <p>Nội dung chi tiết hợp đồng được đính kèm ở các điều khoản tiếp theo...</p>
             
             {/* Mock text repeats */}
             <div className="opacity-50 space-y-4">
                <p>Điều 1: Nội dung công việc và thời gian thực hiện. Hai bên thống nhất thực hiện theo phụ lục đính kèm, đảm bảo các tiêu chí chất lượng, kỹ thuật và tiến độ.</p>
                <p>Điều 2: Giá trị và phương thức thanh toán. Áp dụng thanh toán chuyển khoản, thời hạn không quá 5 ngày làm việc kể từ khi nhận đủ hồ sơ hợp lệ.</p>
             </div>
           </div>

        </div>
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
        <File className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-sm font-medium">Không có tệp đính kèm nào được tìm thấy</p>
      </div>
    )}
    
    {/* Comments Overlay Toggle */}
    
  </div>

  {/* Right Panel: Details & Comments & Actions */}
  <div className="w-[400px] shrink-0 bg-white flex flex-col">
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-6">
        
        {/* Status Box */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
          <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">Tình trạng hồ sơ</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className={cn(
              "px-3 py-1.5 text-[11px] font-bold rounded uppercase tracking-tight inline-flex items-center gap-1.5",
              selectedContract.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : 
              selectedContract.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-200" : 
              selectedContract.status === 'expiring_soon' ? "bg-orange-50 text-blue-600 border border-blue-200" :
              "bg-red-50 text-red-600 border border-red-200"
              )}>
              {selectedContract.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {selectedContract.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
              {selectedContract.status === 'expiring_soon' && <AlertTriangle className="w-3.5 h-3.5" />}
              {selectedContract.status === 'expired' && <AlertCircle className="w-3.5 h-3.5" />}
              {selectedContract.status === 'active' ? 'Đang có hiệu lực' : 
              selectedContract.status === 'pending' ? 'Chờ duyệt' : 
              selectedContract.status === 'expiring_soon' ? 'Sắp hết hạn' : 'Đã hết hạn'}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3">
               <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Thời hạn</p>
               <p className={cn(
                  "text-sm font-bold",
                  selectedContract.status === 'expired' ? "text-red-600" :
                  selectedContract.status === 'expiring_soon' ? "text-blue-600" : "text-slate-900"
               )}>{selectedContract.expiry}</p>
            </div>
            
            <div className="border-t border-slate-200 pt-3">
               <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Giá trị</p>
               <p className="text-sm font-bold text-slate-900">{selectedContract.value}</p>
            </div>
          </div>
        </div>

        {/* Action Panel for Pending */}
        {selectedContract.status === 'pending' && (
          <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl space-y-3">
             <h4 className="text-xs font-bold uppercase text-blue-800 tracking-wider mb-2">Thao tác phê duyệt</h4>
             <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded font-bold text-sm hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2">
               <CheckCircle2 className="w-4 h-4" /> Phê duyệt hồ sơ
             </button>
             <button className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded font-bold text-sm hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
               <CornerDownRight className="w-4 h-4" /> Trả lại / Yêu cầu sửa
             </button>
             <button className="w-full px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded font-bold text-sm hover:bg-red-100 shadow-sm flex items-center justify-center gap-2">
               <XCircle className="w-4 h-4" /> Từ chối ký
             </button>
          </div>
        )}

        {/* Progress */}
        {selectedContract.signers && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Tiến trình chữ ký số</h4>
          </div>
          <div className="p-3 space-y-3">
          {selectedContract.signers.map((signer: any, idx: number) => (
            <div key={idx} className="flex gap-3">
              <div className="w-[20px] flex flex-col items-center">
                 <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", signer.status === 'signed' ? "bg-emerald-500" : "bg-slate-300")} />
                 {idx < selectedContract.signers.length - 1 && <div className="w-[2px] h-full bg-slate-200 my-1" />}
              </div>
              <div className="pb-1">
                 <p className="text-sm font-bold text-slate-900">{signer.name}</p>
                 <p className="text-[11px] text-slate-500">{signer.role}</p>
                 {signer.status === 'signed' ? (
                   <span className="inline-block mt-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Đã ký</span>
                 ) : (
                   <span className="inline-block mt-1 text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Đang chờ</span>
                 )}
              </div>
            </div>
          ))}
          </div>
          
          {selectedContract.signatureStatus === 'pending' && (
             <div className="p-3 border-t border-slate-200 bg-slate-50">
               <button 
                onClick={() => setSigningModalOpen(true)}
                className="w-full py-2 bg-primary-600 text-white rounded text-xs font-bold hover:bg-primary-700 flex items-center justify-center gap-2"
               >
                 <Key className="w-3.5 h-3.5" /> Ký số ngay
               </button>
             </div>
          )}
        </div>
        )}

      </div>
      
      {/* Comments Area */}
      <div className="border-t border-slate-200">
        <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
          <h4 className="text-xs font-bold uppercase text-slate-600 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Bình luận & Góp ý ({selectedContract.comments?.length || 0})
          </h4>
        </div>
        <div className="p-4 space-y-4">
          {(selectedContract.comments || []).map((cmt: any) => (
             <div key={cmt.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-slate-900">{cmt.author}</span>
                  <span className="text-[10px] text-slate-400">{cmt.time}</span>
                </div>
                <p className="text-sm text-slate-700">{cmt.content}</p>
                
                <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity">
                  <Reply className="w-3 h-3" />
                </button>
             </div>
          ))}
          {(!selectedContract.comments || selectedContract.comments.length === 0) && (
            <p className="text-center justify-center py-6 text-sm text-slate-400 italic">Chưa có bình luận nào.</p>
          )}
        </div>
      </div>
      
    </div>

    {/* Comment Input */}
    <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
       <div className="relative">
         <textarea 
           rows={2}
           placeholder="Nhập góp ý, ghi chú để yêu cầu sửa đổi..."
           className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none pr-12 bg-slate-50 focus:bg-white"
         ></textarea>
         <button className="absolute bottom-2 right-2 p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">
           <Send className="w-3.5 h-3.5" />
         </button>
       </div>
    </div>
  </div>
 </div>
 </div>
 </div>
 )}`;

// Now find the original modal code to replace it
const oldModalRe = /\{selectedContract && \(\n\s*<div className="fixed inset-0 z-50[\s\S]*?<\/div>\n\s*<\/div>\n\s*\)\}/;

if (oldModalRe.test(code)) {
    code = code.replace(oldModalRe, UI_BLOCK);
} else {
    console.log("Could not find the original modal layout!");
}

fs.writeFileSync('src/components/ContractManager.tsx', code);
