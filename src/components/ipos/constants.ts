/**
 * Hằng số tĩnh cho iPOS module. Bóc khỏi IPos.tsx để giảm size monolith.
 */

export const BOM_MAP: Record<string, { materialId: string; quantity: number }[]> = {
  "Cafe Phin Sữa Đá": [
    { materialId: "MAT-001", quantity: 0.03 }, // 30g Coffee beans
    { materialId: "MAT-002", quantity: 0.02 }, // 20ml Condensed milk
    { materialId: "MAT-003", quantity: 0.5 },  // 0.5kg Ice
  ],
  "Trà Đào Cam Sả": [
    { materialId: "MAT-004", quantity: 1 },    // 1 Tea bag
    { materialId: "MAT-005", quantity: 0.05 }, // 50ml Syrup
    { materialId: "MAT-006", quantity: 2 },    // 2 Peach slices
  ],
};

export function getColorClasses(color: string): string {
  switch (color) {
    case "blue":     return "bg-primary-50 text-primary-700";
    case "orange":   return "bg-orange-50 text-orange-600";
    case "indigo":   return "bg-primary-50 text-primary-600";
    case "emerald":  return "bg-emerald-50 text-emerald-600";
    case "fuchsia":  return "bg-fuchsia-50 text-fuchsia-600";
    case "rose":     return "bg-rose-50 text-rose-600";
    case "cyan":     return "bg-cyan-50 text-cyan-600";
    case "amber":    return "bg-amber-50 text-amber-600";
    case "slate":
    default:         return "bg-slate-50 text-slate-700";
  }
}

export const INDUSTRY_SECTORS: Record<string, string[]> = {
  "Bán buôn, bán lẻ": [
    "Thời trang",
    "Điện thoại & Điện máy",
    "Vật liệu xây dựng",
    "Nhà thuốc",
    "Mẹ & Bé",
    "Sách & Văn phòng phẩm",
    "Sản xuất",
    "Tạp hóa & Siêu thị",
    "Mỹ phẩm",
    "Nông sản & Thực phẩm",
    "Xe, máy móc",
    "Nội thất & Gia dụng",
    "Hoa & Quà tặng",
    "Khác",
  ],
  "Ăn uống, giải trí": [
    "Nhà hàng",
    "Quán ăn",
    "Cafe, trà sữa",
    "Karaoke, Bida",
    "Bar, Pub & Club",
    "Căn tin & Trạm dừng nghỉ",
  ],
  "Lưu trú, làm đẹp": [
    "Beauty, Spa, Massage",
    "Hair Salon & Nail",
    "Khách sạn, Nhà nghỉ",
    "Homestay, Villa, Resort",
    "Fitness & Yoga",
    "Phòng khám",
    "Phòng khám thú y",
  ],
};

export const MOCK_TOPPINGS = [
  { id: 't1', name: 'Trân châu trắng', price: 10000 },
  { id: 't2', name: 'Trân châu đen', price: 8000 },
  { id: 't3', name: 'Thạch trái cây', price: 12000 },
  { id: 't4', name: 'Thêm Shot Espresso', price: 15000 },
  { id: 't5', name: 'Đổi sữa hạt', price: 10000 },
];
