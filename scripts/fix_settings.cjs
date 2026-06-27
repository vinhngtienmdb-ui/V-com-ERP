const fs = require('fs');
const path = 'src/components/Settings.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const newLines = `    <Modal
      title={editingFee ? 'Chỉnh sửa loại phí' : 'Thêm loại phí mới'}
      icon={<BadgeDollarSign className="w-5 h-5 text-blue-600" />}
      isOpen={showFeeModal}
      maxWidth="lg"
      onClose={() => setShowFeeModal(false)}
      onConfirm={() => {
        if (editingFee) {
          setSystemFees(systemFees.map(f => f.id === editingFee.id ? { ...newFee, id: f.id } : f));
          logAction('Settings.Fees', 'UPDATE', \`Cập nhật loại phí: \${newFee.name}\`);
        } else {
          setSystemFees([...systemFees, { ...newFee, id: \`sys-\${Date.now()}\`, isActive: true }]);
          logAction('Settings.Fees', 'CREATE', \`Thêm mới loại phí: \${newFee.name}\`);
        }
        setShowFeeModal(false);
        addNotification('Đã cập nhật cấu hình', \`Loại phí \${newFee.name} đã được lưu thành công.\`);
      }}
      confirmText={editingFee ? 'Cập nhật' : 'Xác nhận Thêm'}
    >
      <div className="space-y-6">`.split('\n');

lines.splice(5514, 11, ...newLines);
fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed syntax error in Settings.tsx');
