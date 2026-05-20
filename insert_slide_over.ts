import fs from 'fs';
let code = fs.readFileSync('src/components/RequestHub.tsx', 'utf-8');

const slideOverStr = `
  {/* Selected Request Detail Slide-over Panel */}
  <AnimatePresence>
  {selectedRequestForView && (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-3xl bg-white shadow-2xl h-full overflow-y-auto flex flex-col border-l border-emerald-200"
      >
        <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Chi tiết Đề xuất</h3>
              <p className="text-xs text-emerald-700 font-medium">Phiếu: {selectedRequestForView.id} | {selectedRequestForView.subtype}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setSelectedRequestForPrint(selectedRequestForView);
                setShowPrintModal(true);
              }}
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
            >
              <Printer className="w-4 h-4" /> In
            </button>
            <button onClick={() => setSelectedRequestForView(null)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 flex-1 space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Người đề xuất</p>
              <p className="text-sm font-bold text-slate-900">{selectedRequestForView.requester}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày gửi</p>
              <p className="text-sm font-bold text-slate-900">{selectedRequestForView.date}</p>
            </div>
            <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tiêu đề / Lý do</p>
              <p className="text-sm font-bold text-slate-900">{selectedRequestForView.title}</p>
            </div>
          </div>

          {/* Form Data */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 border-b border-emerald-100 pb-2 text-emerald-800 flex items-center gap-2">
              <Layout className="w-4 h-4" /> Dữ liệu biểu mẫu
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {formConfigs.find((c: any) => c.name === selectedRequestForView.subtype)?.fields?.map((field: any) => (
                <div key={field.id} className={field.type === 'textarea' ? "col-span-2" : ""}>
                  <p className="text-xs font-bold text-slate-500 border-b border-slate-200 pb-1 mb-1">{field.label}</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{(selectedRequestForView.formData || {})[field.id] || '---'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Workflow */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4 border-b border-indigo-100 pb-2 text-indigo-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Luồng Phê duyệt
            </h4>
            <div className="relative pl-4 space-y-6">
              <div className="absolute left-[7px] top-4 bottom-4 w-px bg-slate-200" />
              {(selectedRequestForView.approvalLog || []).map((log: any, idx: number) => (
                <div key={idx} className="relative z-10 flex gap-4">
                  <div className={cn(
                    "w-[14px] h-[14px] rounded-full shrink-0 border-2 mt-1 bg-white",
                    log.status === 'approved' ? "border-emerald-500" : "border-rose-500"
                  )} />
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-slate-800">{log.stepName}</p>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        log.status === 'approved' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>{log.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{log.by}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
              
              {formConfigs.find((c: any) => c.name === selectedRequestForView.subtype)?.workflow?.slice((selectedRequestForView.approvalLog || []).length).map((_: any, idx: number) => (
                <div key={'w-'+idx} className="relative z-10 flex gap-4 opacity-50">
                  <div className="w-[14px] h-[14px] rounded-full shrink-0 border-2 border-slate-300 bg-slate-100 mt-1" />
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-600 mb-1">Cấp duyệt {(selectedRequestForView.approvalLog || []).length + idx + 1}</p>
                    <p className="text-[10px] font-bold text-amber-600">Đang chờ xử lý...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Area based on Rules */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Thao tác</h4>
            <div className="flex flex-wrap gap-3">
              {/* Creator Revoke */}
              {(selectedRequestForView.status === 'pending') && (!selectedRequestForView.approvalLog || selectedRequestForView.approvalLog.length === 0) && (
                <button 
                  onClick={() => handleRevokeRequest(selectedRequestForView.id)}
                  className="px-4 py-2 border border-rose-300 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-50 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Thu hồi đề xuất
                </button>
              )}

              {/* Delete Request */}
              {(selectedRequestForView.status === 'revoked' || selectedRequestForView.status === 'rejected') && (
                <button 
                  onClick={() => handleDeleteRequest(selectedRequestForView.id)}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn
                </button>
              )}
              
              {/* Approver Action */}
              {selectedRequestForView.status === 'pending' && (
                <>
                  <button 
                    onClick={() => {
                      handleStatusChange(selectedRequestForView.id, 'approved');
                      const updatedReq = { ...selectedRequestForView, status: 'approved' };
                      setSelectedRequestForView(updatedReq);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Phê duyệt
                  </button>
                  <button 
                    onClick={() => setSigningRequestId(selectedRequestForView.id)}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <FileSignature className="w-4 h-4" /> Ký & Duyệt
                  </button>
                  <button 
                    onClick={() => {
                      handleStatusChange(selectedRequestForView.id, 'rejected');
                      setSelectedRequestForView({ ...selectedRequestForView, status: 'rejected' });
                    }}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors flex items-center gap-2"
                  >
                    Từ chối
                  </button>
                </>
              )}

              {/* Change Approval */}
              {(selectedRequestForView.status === 'approved' || selectedRequestForView.status === 'rejected') && (
                 <button 
                    onClick={() => {
                      if(window.confirm('Bạn muốn lùi trạng thái về chờ duyệt?')) {
                        handleStatusChange(selectedRequestForView.id, 'pending');
                        setSelectedRequestForView({ ...selectedRequestForView, status: 'pending' });
                      }
                    }}
                    className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg text-sm font-bold hover:bg-amber-50 transition-colors flex items-center gap-2"
                 >
                   <RefreshCw className="w-4 h-4" /> Reset trạng thái
                 </button>
              )}

            </div>
          </div>

        </div>
      </motion.div>
    </div>
  )}
  </AnimatePresence>
`;

code = code.replace(/\{\/\* Digital Signature Modal \*\/\}/, slideOverStr + '\n  {/* Digital Signature Modal */}');
fs.writeFileSync('src/components/RequestHub.tsx', code);
