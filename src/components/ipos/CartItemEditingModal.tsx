import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MOCK_TOPPINGS } from './constants';

interface CartItem {
  id: string;
  name: string;
  note?: string;
  toppings?: any[];
  [key: string]: any;
}

interface Props {
  item: CartItem;
  onClose: () => void;
  onSave: (updatedItem: CartItem) => void;
}

export const CartItemEditingModal = ({ item, onClose, onSave }: Props) => {
  const [note, setNote] = useState(item.note || '');
  const [toppings, setToppings] = useState<any[]>(item.toppings || []);

  const handleToggleTopping = (topping: any) => {
    if (toppings.find(t => t.id === topping.id)) {
      setToppings(toppings.filter(t => t.id !== topping.id));
    } else {
      setToppings([...toppings, topping]);
    }
  };

  const handleSave = () => {
    onSave({ ...item, note, toppings });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{item.name}</h3>
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary-600 mt-1">Tùy chỉnh món</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Ghi chú */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 uppercase tracking-widest block">
              Ghi chú thêm
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ít đá, không đường, ..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 transition-all resize-none shadow-sm h-24"
            />
          </div>

          {/* Toppings */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 uppercase tracking-widest block">
              Thêm Topping / Phụ phí
            </label>
            <div className="space-y-2">
              {MOCK_TOPPINGS.map(topping => {
                const isSelected = toppings.some((t: any) => t.id === topping.id);
                return (
                  <label
                    key={topping.id}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected ? "border-primary-600 bg-primary-50/50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        isSelected ? "bg-primary-600 border-primary-600 text-white" : "border-slate-400"
                      )}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className={cn("text-sm font-bold", isSelected ? "text-primary-900" : "text-slate-800")}>{topping.name}</span>
                    </div>
                    <span className={cn("text-xs font-black", isSelected ? "text-primary-600" : "text-slate-600")}>
                      +{new Intl.NumberFormat('vi-VN').format(topping.price)}
                    </span>
                    <input type="checkbox" className="hidden" checked={isSelected} onChange={() => handleToggleTopping(topping)} />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg font-bold text-slate-700 hover:bg-slate-200 transition-colors text-sm">
            Hủy
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-lg font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-colors text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Lưu tùy chỉnh
          </button>
        </div>
      </div>
    </div>
  );
};
