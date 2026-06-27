import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Cpu, 
  DollarSign, 
  RefreshCw, 
  ShoppingCart, 
  Percent, 
  Boxes, 
  ShieldCheck, 
  Store, 
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { cn } from '../lib/utils';

export function AIPredictions() {
  const { staffInfo } = useAuth();
  const { addNotification } = useNotifications();
  const tenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';

  const [activeTab, setActiveTab] = useState<'forecasting' | 'pricing'>('forecasting');
  
  // Forecasting States
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [forecastingData, setForecastingData] = useState<any[]>([]);
  const [forecastingRecs, setForecastingRecs] = useState<any[]>([]);
  const [loadingForecasting, setLoadingForecasting] = useState(false);
  const [prSubmittingId, setPrSubmittingId] = useState<string | null>(null);

  // Pricing States
  const [pricingSuggestions, setPricingSuggestions] = useState<any[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [applyingPriceId, setApplyingPriceId] = useState<string | null>(null);

  const fetchForecasting = async (storeId?: string) => {
    setLoadingForecasting(true);
    try {
      const response = await fetch('/api/ai/demand-forecasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, storeId: storeId || undefined })
      });
      const data = await response.json();
      if (response.ok) {
        setForecastingData(data.forecastData || []);
        setForecastingRecs(data.recommendations || []);
      } else {
        console.error('Forecasting error:', data.error);
      }
    } catch (e) {
      console.error('Fetch forecasting exception:', e);
    } finally {
      setLoadingForecasting(false);
    }
  };

  const fetchPricing = async () => {
    setLoadingPricing(true);
    try {
      const response = await fetch('/api/ai/dynamic-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      });
      const data = await response.json();
      if (response.ok) {
        setPricingSuggestions(data.suggestions || []);
      } else {
        console.error('Pricing error:', data.error);
      }
    } catch (e) {
      console.error('Fetch pricing exception:', e);
    } finally {
      setLoadingPricing(false);
    }
  };

  useEffect(() => {
    fetchForecasting();
    fetchPricing();
  }, [tenantId]);

  const handleCreatePurchaseRequest = (productId: string, productName: string, qty: number) => {
    setPrSubmittingId(productId);
    
    // Simulate loading for better UX
    setTimeout(() => {
      try {
        const cached = localStorage.getItem('vcomm_purchase_requests');
        const requests = cached ? JSON.parse(cached) : [];

        // Check if already created
        const exists = requests.some((r: any) => r.productId === productId && r.status === 'pending');
        if (exists) {
          alert(`Đã tồn tại đề xuất mua hàng cho sản phẩm "${productName}" đang chờ duyệt.`);
          setPrSubmittingId(null);
          return;
        }

        const newPr = {
          id: `PR-${Date.now().toString().slice(-8)}`,
          department: 'Kho vận (AI)',
          title: `[AI] Đề xuất nhập thêm hàng cho ${productName}`,
          requester: staffInfo?.username || 'AI Ops Specialist',
          value: qty * 150000, // mock base value
          status: 'pending',
          date: new Date().toLocaleDateString('vi-VN'),
          itemsCount: qty,
          productId: productId
        };

        const updated = [newPr, ...requests];
        localStorage.setItem('vcomm_purchase_requests', JSON.stringify(updated));

        addNotification(
          'Đề xuất mua hàng tự động',
          `Đã tạo đề xuất mua hàng ${newPr.id} cho ${productName} (Số lượng: ${qty})`
        );
        alert(`Đã tự động lập Phiếu đề xuất mua hàng ${newPr.id} thành công! Bạn có thể duyệt phiếu này trong module Procurement.`);
      } catch (err) {
        console.error('Failed to create PR:', err);
      } finally {
        setPrSubmittingId(null);
      }
    }, 800);
  };

  const handleApplyPrice = async (productId: string, newPrice: number) => {
    setApplyingPriceId(productId);
    try {
      const response = await fetch('/api/ai/apply-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newPrice, tenantId })
      });
      const data = await response.json();
      if (response.ok) {
        addNotification(
          'Điều chỉnh giá động',
          `Đã áp dụng giá mới cho sản phẩm. ${data.message || ''}`
        );
        // Refresh pricing data to reflect changes
        fetchPricing();
        alert(`Cập nhật giá bán động thành công! Đã đồng bộ lên PostgreSQL và Firestore.`);
      } else {
        alert(`Lỗi khi cập nhật giá: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi kết nối: ${err.message}`);
    } finally {
      setApplyingPriceId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in- duration-700 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 bg-cyan-950/10 border border-cyan-200 px-2 py-0.5 rounded-none">
              AI Predictions Hub
            </span>
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          </div>
          <h1 className="font-serif tracking-tight text-3xl font-black text-slate-900">
            Dự báo & Giá bán động <span className="text-cyan-700">(AI-Powered)</span>
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Ứng dụng thuật toán Gemini AI tối ưu hóa vòng quay tồn kho và doanh số bán hàng.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (activeTab === 'forecasting') fetchForecasting(selectedStore);
              else fetchPricing();
            }}
            className="bg-white border border-slate-300 px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm border-b-2 active:translate-y-0.5"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/30 p-2 overflow-x-auto whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('forecasting')}
            className={cn(
              "px-6 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 rounded-none",
              activeTab === 'forecasting' ? "bg-slate-900 text-[#FAF9F5] shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <Boxes className="w-4 h-4" /> Dự báo nhu cầu tồn kho
          </button>
          <button 
            onClick={() => setActiveTab('pricing')}
            className={cn(
              "px-6 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 rounded-none",
              activeTab === 'pricing' ? "bg-slate-900 text-[#FAF9F5] shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <Zap className="w-4 h-4" /> Gợi ý giá bán động AI
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: DEMAND FORECASTING */}
          {activeTab === 'forecasting' && (
            <div className="space-y-8">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-700">Lọc chi nhánh / kho:</span>
                  <select 
                    value={selectedStore} 
                    onChange={(e) => {
                      setSelectedStore(e.target.value);
                      fetchForecasting(e.target.value);
                    }}
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="">Tất cả kho hàng</option>
                    <option value="STORE_001">Kho Bán Lẻ Hà Nội (STORE_001)</option>
                    <option value="STORE_002">Kho Bán Lẻ TP.HCM (STORE_002)</option>
                  </select>
                </div>
                
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Realtime Sync
                </div>
              </div>

              {loadingForecasting ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider animate-pulse">AI đang phân tích dữ liệu đơn hàng và chạy dự báo nhu cầu...</p>
                </div>
              ) : forecastingData.length === 0 ? (
                <div className="p-16 border-2 border-dashed border-slate-200 text-center rounded-lg">
                  <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Không có dữ liệu tồn kho hoặc đơn hàng để dự báo.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Summary recommendations */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-600" /> Khuyến nghị bổ sung hàng tồn kho từ Gemini AI
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {forecastingRecs.map((rec, idx) => {
                        const recDetail = forecastingData.find(d => d.productId === rec.productId);
                        return (
                          <div 
                            key={idx} 
                            className={cn(
                              "p-5 rounded-none border flex flex-col justify-between gap-4 relative overflow-hidden transition-all",
                              rec.action === 'buy' 
                                ? "bg-amber-50/20 border-amber-200 hover:border-amber-300" 
                                : "bg-slate-50/30 border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{rec.productName}</h4>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">SKU: {rec.productId}</p>
                              </div>
                              <span 
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-none",
                                  rec.action === 'buy' 
                                    ? "bg-amber-100 border-amber-300 text-amber-800" 
                                    : "bg-slate-100 border-slate-300 text-slate-700"
                                )}
                              >
                                {rec.action === 'buy' ? 'Đề xuất Nhập hàng' : 'Đang ở mức An toàn'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 font-bold leading-relaxed pr-2">
                              {rec.reason}
                            </p>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
                              <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                                <div>Tồn hiện tại: <span className="text-slate-800 font-black">{recDetail?.currentStock || 0}</span></div>
                                <div>Ngưỡng an toàn: <span className="text-slate-800 font-black">{recDetail?.safetyStock || 0}</span></div>
                              </div>
                              
                              {rec.action === 'buy' && (
                                <button
                                  onClick={() => handleCreatePurchaseRequest(rec.productId, rec.productName, rec.qty)}
                                  disabled={prSubmittingId === rec.productId}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                >
                                  {prSubmittingId === rec.productId ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <ShoppingCart className="w-3 h-3" />
                                  )}
                                  Lập PR ({rec.qty} cái)
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic charts visualization for each product */}
                  <div className="space-y-6 pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-600" /> Biểu đồ Xu hướng Bán hàng & Dự báo (Recharts)
                    </h3>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {forecastingData.map((item, idx) => {
                        // Merge history and future for visualization
                        const chartData = [
                          { name: 'W1', sold: item.weeklyHistory[0]?.sold || 0, isForecast: false },
                          { name: 'W2', sold: item.weeklyHistory[1]?.sold || 0, isForecast: false },
                          { name: 'W3', sold: item.weeklyHistory[2]?.sold || 0, isForecast: false },
                          { name: 'W4 (Hiện tại)', sold: item.weeklyHistory[3]?.sold || 0, isForecast: false },
                          { name: 'W5 (AI)', sold: item.forecastFuture[2]?.sold || 0, isForecast: true },
                          { name: 'W6 (AI)', sold: item.forecastFuture[3]?.sold || 0, isForecast: true }
                        ];

                        return (
                          <div key={idx} className="bg-white p-5 border border-slate-200 rounded-none shadow-xs space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-black text-slate-900">{item.productName}</h4>
                                <div className="flex gap-3 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                  <span>Tồn hiện tại: <span className="text-slate-800 font-extrabold">{item.currentStock}</span></span>
                                  <span>Dự báo dùng được: <span className={cn("font-extrabold", item.daysOfStockLeft < 10 ? "text-rose-600" : "text-emerald-600")}>{item.daysOfStockLeft} ngày</span></span>
                                </div>
                              </div>
                            </div>

                            <div className="h-56 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                                  <YAxis tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                                  <Tooltip contentStyle={{ fontSize: '11px', fontWeight: 700, borderRadius: '8px' }} />
                                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                                  <Bar dataKey="sold" name="Lượng tiêu thụ" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.isForecast ? "#06B6D4" : "#1E293B"} 
                                        fillOpacity={entry.isForecast ? 0.7 : 1}
                                      />
                                    ))}
                                  </Bar>
                                  <Line type="monotone" dataKey="sold" name="Xu hướng" stroke="#EC4899" strokeWidth={2} dot={{ r: 3 }} />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI DYNAMIC PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5 p-4 bg-slate-50 border border-slate-200">
                <Info className="w-4 h-4 text-cyan-600 shrink-0" />
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  Hệ thống AI định giá động tự động phân tích chỉ số <strong className="text-slate-900 font-extrabold">Vòng quay hàng tồn kho (Inventory Turnover Velocity)</strong> của 30 ngày qua để đề xuất tăng giá bám thị trường hoặc giảm giá xả hàng tồn kho bán chậm.
                </p>
              </div>

              {loadingPricing ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider animate-pulse">AI đang phân tích hành vi mua sắm và đề xuất mức giá tối ưu...</p>
                </div>
              ) : pricingSuggestions.length === 0 ? (
                <div className="p-16 border-2 border-dashed border-slate-200 text-center rounded-lg">
                  <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Không tìm thấy sản phẩm nào để tính toán giá động.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[#6B7280] font-black uppercase tracking-wider">
                          <th className="px-6 py-4">Tên Sản phẩm</th>
                          <th className="px-6 py-4 text-center">Tồn kho / Bán (30 ngày)</th>
                          <th className="px-6 py-4 text-center">Tốc độ vòng quay</th>
                          <th className="px-6 py-4 text-right">Giá Hiện tại</th>
                          <th className="px-6 py-4 text-right">Giá Gợi ý AI</th>
                          <th className="px-6 py-4 text-center">Trạng thái / Đề xuất</th>
                          <th className="px-6 py-4">Lý do khuyến nghị</th>
                          <th className="px-6 py-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pricingSuggestions.map((sug, idx) => {
                          const diff = sug.suggestedPrice - sug.currentPrice;
                          const pct = sug.currentPrice > 0 ? (diff / sug.currentPrice) * 100 : 0;
                          
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-extrabold text-slate-900 block">{sug.productName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {sug.productId}</span>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-slate-700">
                                {sug.stock !== undefined ? sug.stock : '-'} / {sug.sold30d !== undefined ? sug.sold30d : '-'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                                  {sug.turnoverRate !== undefined ? `${(sug.turnoverRate * 100).toFixed(0)}%` : '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-slate-800">
                                {formatCurrency(sug.currentPrice)}
                              </td>
                              <td className="px-6 py-4 text-right font-extrabold text-cyan-700">
                                {formatCurrency(sug.suggestedPrice)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {sug.action === 'increase' && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-600 px-2.5 py-1 flex items-center gap-1 justify-center">
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Tăng giá (+{pct.toFixed(0)}%)
                                  </span>
                                )}
                                {sug.action === 'discount' && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-600 px-2.5 py-1 flex items-center gap-1 justify-center">
                                    <ArrowDownRight className="w-3.5 h-3.5" /> Giảm giá ({pct.toFixed(0)}%)
                                  </span>
                                )}
                                {sug.action === 'keep' && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 flex items-center gap-1 justify-center">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Giữ nguyên
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 max-w-xs whitespace-normal font-bold text-slate-600 leading-relaxed">
                                {sug.reason}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {sug.action !== 'keep' ? (
                                  <button
                                    onClick={() => handleApplyPrice(sug.productId, sug.suggestedPrice)}
                                    disabled={applyingPriceId === sug.productId}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] font-black uppercase tracking-widest text-[9px] transition-colors disabled:opacity-50 flex items-center gap-1 mx-auto cursor-pointer"
                                  >
                                    {applyingPriceId === sug.productId ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    )}
                                    Áp dụng
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Không cần thiết</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
