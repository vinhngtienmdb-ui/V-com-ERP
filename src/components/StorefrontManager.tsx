import React, { useState } from 'react';
import {
  Globe,
  Layout,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  ExternalLink,
  Eye,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Smartphone,
  Monitor,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Truck
} from 'lucide-react';

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  active: boolean;
}

interface StorefrontConfig {
  domain: string;
  storeName: string;
  slogan: string;
  logoUrl: string;
  themeColor: string;
  seoTitle: string;
  seoDescription: string;
  googleAnalyticsId: string;
  hotline: string;
  email: string;
  address: string;
  showFlashSale: boolean;
  showBestSellers: boolean;
  freeShippingThreshold: number;
}

export const StorefrontManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'design' | 'banners' | 'seo' | 'policies'>('design');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [config, setConfig] = useState<StorefrontConfig>({
    domain: 'shop.vcomm.vn',
    storeName: 'VComm Official Flagship Store',
    slogan: 'Thiết Bị Công Nghệ & Tiêu Dùng Thông Minh Chính Hãng',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    themeColor: '#2563eb',
    seoTitle: 'VComm Shop - Mua sắm Thiết bị Thông minh & Gia dụng Cao cấp Chính hãng',
    seoDescription: 'Hệ thống mua sắm trực tuyến chính thức VComm. Cam kết 100% hàng chính hãng, bảo hành điện tử 24 tháng, miễn phí vận chuyển toàn quốc.',
    googleAnalyticsId: 'G-VCOMM202688',
    hotline: '1900 888 999',
    email: 'support@shop.vcomm.vn',
    address: 'Tòa nhà VComm Innovation, Cầu Giấy, Hà Nội',
    showFlashSale: true,
    showBestSellers: true,
    freeShippingThreshold: 500000
  });

  const [banners, setBanners] = useState<BannerSlide[]>([
    {
      id: 'B1',
      title: 'ĐẠI TIỆC CÔNG NGHỆ 2026 - GIẢM ĐẾN 45%',
      subtitle: 'Sở hữu tai nghe chống ồn, đồng hồ thông minh & phụ kiện AI cao cấp',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      ctaText: 'Khám phá ngay',
      ctaLink: '/collections/mega-sale',
      active: true
    },
    {
      id: 'B2',
      title: 'BỘ SƯU TẬP THU ĐÔNG SMART LIVING',
      subtitle: 'Tiết kiệm năng lượng thông minh, điều khiển bằng giọng nói tiếng Việt',
      imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
      ctaText: 'Xem sản phẩm',
      ctaLink: '/collections/smart-home',
      active: true
    }
  ]);

  const handleSaveConfig = () => {
    showToast('Đã lưu và xuất bản cấu hình Website Bán hàng thành công! CDN Cache đã được xóa.');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            <span>Kênh Bán Hàng Trực Tuyến & Cửa Hàng Web B2C/D2C</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Quản trị Website Bán hàng (Storefront CMS)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200/80 font-mono">
              Live: {config.domain}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tùy biến giao diện website bán hàng, quản lý banner slider khuyến mãi, cấu hình SEO Google và chính sách mua sắm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://${config.domain}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 transition"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            Xem Web thực tế
          </a>
          <button
            onClick={handleSaveConfig}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            <Save className="w-4 h-4" />
            Lưu & Xuất bản CDN
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 w-fit">
        <button
          onClick={() => setActiveTab('design')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'design'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Giao diện & Cài đặt chung
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'banners'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Banner Slider ({banners.length})
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'seo'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          SEO & Google Meta
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'policies'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Chính sách & Pháp lý TMĐT
        </button>
      </div>

      {/* Design Tab */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-600" />
                Thông tin Cửa hàng Trực tuyến
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Tên thương hiệu cửa hàng</label>
                  <input
                    type="text"
                    value={config.storeName}
                    onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Tên miền tùy chỉnh (Custom Domain)</label>
                  <input
                    type="text"
                    value={config.domain}
                    onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-blue-700 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold text-xs">Khẩu hiệu / Slogan hiển thị ở Header</label>
                <input
                  type="text"
                  value={config.slogan}
                  onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Hotline CSKH</label>
                  <input
                    type="text"
                    value={config.hotline}
                    onChange={(e) => setConfig({ ...config, hotline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Email hỗ trợ đơn hàng</label>
                  <input
                    type="text"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Freeship từ đơn hàng (VNĐ)</label>
                  <input
                    type="number"
                    value={config.freeShippingThreshold}
                    onChange={(e) => setConfig({ ...config, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-emerald-700 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Layout Modules Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Các khối Module hiển thị trên Trang chủ
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Khối Flash Sale đếm ngược theo giờ</span>
                    <span className="text-slate-500 text-[11px]">Tự động lấy sản phẩm đang có chương trình giảm giá sâu nhất</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showFlashSale}
                    onChange={(e) => setConfig({ ...config, showFlashSale: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Khối Sản phẩm Bán chạy (Best-Sellers)</span>
                    <span className="text-slate-500 text-[11px]">Dựa trên số lượng bán ra thực tế từ hệ thống Đơn hàng VComm</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showBestSellers}
                    onChange={(e) => setConfig({ ...config, showBestSellers: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Mobile/Desktop Mockup Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Xem trước Website (Live Preview)</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg transition ${previewDevice === 'desktop' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'}`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg transition ${previewDevice === 'mobile' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mockup Frame */}
              <div className={`mx-auto bg-slate-50 rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm transition-all ${
                previewDevice === 'mobile' ? 'w-64 min-h-[420px]' : 'w-full min-h-[350px]'
              }`}>
                {/* Store Header Mock */}
                <div className="bg-blue-600 text-white p-2.5 text-[10px] flex items-center justify-between shadow-xs">
                  <span className="font-bold truncate">{config.storeName}</span>
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>

                {/* Hero Banner Mock */}
                <div className="relative h-28 bg-cover bg-center p-3 flex flex-col justify-end text-white" style={{ backgroundImage: `url(${banners[0].imageUrl})` }}>
                  <div className="absolute inset-0 bg-slate-900/50" />
                  <div className="relative z-10">
                    <div className="font-black text-[11px] line-clamp-1">{banners[0].title}</div>
                    <div className="text-[9px] text-slate-200 line-clamp-1">{banners[0].subtitle}</div>
                    <button className="mt-1 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded shadow-xs">
                      {banners[0].ctaText}
                    </button>
                  </div>
                </div>

                {/* Product Grid Mock */}
                <div className="p-2.5 space-y-2 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-800 flex justify-between">
                    <span>Sản phẩm nổi bật</span>
                    <span className="text-blue-600 text-[9px] font-semibold">Xem tất cả &gt;</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-[9px] shadow-2xs">
                      <div className="w-full h-12 bg-slate-100 rounded-lg mb-1.5" />
                      <div className="font-bold text-slate-900 truncate">Tai nghe Không dây Pro</div>
                      <div className="text-emerald-700 font-bold">890.000 đ</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-[9px] shadow-2xs">
                      <div className="w-full h-12 bg-slate-100 rounded-lg mb-1.5" />
                      <div className="font-bold text-slate-900 truncate">Đồng hồ AI Watch v2</div>
                      <div className="text-emerald-700 font-bold">1.450.000 đ</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>SSL Cloudflare: <strong className="text-emerald-700">Đã kích hoạt</strong></span>
              <span>CDN Cache: <strong className="text-blue-700">Edge 99.9%</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Danh sách Banner Quảng bá & Slider
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Khuyến nghị kích thước: 1920x600px cho Desktop, định dạng WebP hoặc PNG tối ưu tải trang</p>
            </div>
            <button
              onClick={() => {
                const newB: BannerSlide = {
                  id: `B${banners.length + 1}`,
                  title: 'CHƯƠNG TRÌNH KHUYẾN MÃI MỚI',
                  subtitle: 'Ưu đãi dành riêng cho khách hàng VComm thành viên',
                  imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&auto=format&fit=crop&q=80',
                  ctaText: 'Mua sắm ngay',
                  ctaLink: '/collections/sale',
                  active: true
                };
                setBanners([...banners, newB]);
                showToast('Đã thêm banner slider mới');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Thêm banner mới
            </button>
          </div>

          <div className="space-y-3">
            {banners.map((b, idx) => (
              <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <img src={b.imageUrl} alt={b.title} className="w-28 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{b.title}</h4>
                    <p className="text-xs text-slate-500">{b.subtitle}</p>
                    <span className="text-[11px] text-blue-700 font-semibold mt-1 block">CTA: [{b.ctaText}] ➔ {b.ctaLink}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => {
                      setBanners(prev => prev.map(item => item.id === b.id ? { ...item, active: !item.active } : item));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      b.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {b.active ? 'Đang hiển thị' : 'Tạm ẩn'}
                  </button>
                  <button
                    onClick={() => {
                      setBanners(prev => prev.filter(item => item.id !== b.id));
                      showToast('Đã xóa banner');
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            Tối ưu hóa Công cụ Tìm kiếm (SEO & OpenGraph)
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Tiêu đề Trang Web (Meta Title - Max 70 ký tự)</label>
              <input
                type="text"
                value={config.seoTitle}
                onChange={(e) => setConfig({ ...config, seoTitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Mô tả Trang Web (Meta Description - Max 160 ký tự)</label>
              <textarea
                rows={3}
                value={config.seoDescription}
                onChange={(e) => setConfig({ ...config, seoDescription: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-blue-500 resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Google Search Snippet Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-2 font-bold">
                Bản xem trước trên kết quả tìm kiếm Google (SERP Preview):
              </span>
              <div className="text-blue-700 text-sm font-bold hover:underline cursor-pointer">
                {config.seoTitle}
              </div>
              <div className="text-emerald-700 text-xs mt-0.5 font-medium">https://{config.domain}</div>
              <div className="text-slate-600 text-xs mt-1 leading-relaxed">
                {config.seoDescription}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Chính sách Bán hàng & Chứng nhận Thương mại Điện tử
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <Truck className="w-4 h-4" />
                Chính sách Vận chuyển
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Đồng bộ tự động các đơn vị vận chuyển ViettelPost, GHTK, GHN. Cam kết giao hỏa tốc 2h nội thành và 2-3 ngày toàn quốc.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 font-bold">
                <CreditCard className="w-4 h-4" />
                Cổng Thanh toán Trực tuyến
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Hỗ trợ VietQR PRO, thẻ ATM Napas nội địa, thẻ quốc tế Visa/Mastercard và Trả góp 0% qua ngân hàng liên kết.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <ShieldCheck className="w-4 h-4" />
                Đăng ký Bộ Công Thương
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Đã gắn mã khai báo Website TMĐT bán hàng hợp lệ với Cục Thương mại điện tử và Kinh tế số - Bộ Công Thương.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
