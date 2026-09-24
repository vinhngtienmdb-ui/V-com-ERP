import { ComprehensiveSeller } from '../types/sellerKyc';

export const COMPREHENSIVE_MOCK_SELLERS: ComprehensiveSeller[] = [
  {
    id: 'SEL-VN-001',
    shopName: 'An Nhiên Organic Mart',
    legalType: 'INDIVIDUAL',
    representativeName: 'NGUYỄN VĂN THÀNH',
    phone: '0912 345 678',
    email: 'thanh.nguyen@annhienorganic.vn',
    businessAddress: 'Số 45 Đường Giải Phóng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội',
    warehouseAddress: 'Kho số 3, Cụm công nghiệp Hoàng Mai, Hà Nội',
    status: 'pending',
    vneid: {
      citizenId: '001092008742',
      fullName: 'NGUYỄN VĂN THÀNH',
      dob: '15/08/1992',
      gender: 'Nam',
      permanentAddress: 'Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội',
      level: 2,
      verifiedAt: '18/09/2026 09:30:15',
      qrVerified: true,
      matchRate: 100
    },
    tax: {
      taxCode: '8392019482',
      registeredName: 'NGUYỄN VĂN THÀNH',
      taxStatus: 'ACTIVE',
      vatRate: 1.0,
      pitRate: 0.5,
      invoiceType: 'PLATFORM_WITHHOLDING',
      taxOffice: 'Chi cục Thuế Quận Hai Bà Trưng'
    },
    bank: {
      bankName: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
      accountNumber: '0011004567890',
      accountHolder: 'NGUYEN VAN THANH',
      isMatchedWithName: true
    },
    documents: [
      {
        id: 'doc-1',
        type: 'VNEID_CARD_FRONT',
        title: 'Thẻ CCCD gắn chip (Mặt trước)',
        fileName: 'CCCD_NguyenVanThanh_Front.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800&auto=format&fit=crop',
        uploadedAt: '18/09/2026 09:28',
        status: 'VERIFIED',
        ocrData: {
          'Số CCCD': '001092008742',
          'Họ và tên': 'NGUYỄN VĂN THÀNH',
          'Ngày sinh': '15/08/1992',
          'Quốc tịch': 'Việt Nam'
        }
      },
      {
        id: 'doc-2',
        type: 'VNEID_CARD_BACK',
        title: 'Thẻ CCCD gắn chip (Mặt sau)',
        fileName: 'CCCD_NguyenVanThanh_Back.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800&auto=format&fit=crop',
        uploadedAt: '18/09/2026 09:28',
        status: 'VERIFIED',
        ocrData: {
          'Đặc điểm nhận dạng': 'Nốt ruồi cách 1cm dưới đuôi mắt trái',
          'Ngày cấp': '20/04/2021',
          'Nơi cấp': 'Cục Cảnh sát QLHC về TTXH'
        }
      },
      {
        id: 'doc-3',
        type: 'FOOD_SAFETY_CERT',
        title: 'Giấy chứng nhận Cơ sở đủ ĐK ATTP',
        fileName: 'ChungNhan_ATTP_AnNhien.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
        uploadedAt: '18/09/2026 09:29',
        status: 'VERIFIED',
        ocrData: {
          'Số chứng nhận': '124/2024/ATTP-HN',
          'Ngày cấp': '10/01/2024',
          'Cơ quan cấp': 'Chi cục An toàn vệ sinh thực phẩm Hà Nội'
        }
      }
    ],
    totalProducts: 45,
    rating: 0,
    gmv: 0,
    walletBalance: 0,
    commissionRate: 5.0,
    joinDate: '18/09/2026',
    partnerCategory: 'seller',
    activeModules: ['orders', 'pim', 'marketing']
  },
  {
    id: 'SEL-VN-002',
    shopName: 'Hộ Kinh Doanh Bách Hóa Mỹ Kim',
    legalType: 'HOUSEHOLD',
    representativeName: 'TRẦN THỊ MỸ KIM',
    phone: '0908 776 543',
    email: 'mykim.bachhoa@gmail.com',
    businessAddress: '158 Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    warehouseAddress: '158 Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    status: 'pending',
    vneid: {
      citizenId: '079185012398',
      fullName: 'TRẦN THỊ MỸ KIM',
      dob: '22/11/1985',
      gender: 'Nữ',
      permanentAddress: 'Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
      level: 2,
      verifiedAt: '17/09/2026 14:15:20',
      qrVerified: true,
      matchRate: 100
    },
    tax: {
      taxCode: '0317894562',
      registeredName: 'HỘ KINH DOANH BÁCH HÓA MỸ KIM',
      taxStatus: 'ACTIVE',
      vatRate: 1.0,
      pitRate: 0.5,
      invoiceType: 'PLATFORM_WITHHOLDING',
      taxOffice: 'Chi cục Thuế Quận 3 - TP.HCM'
    },
    bank: {
      bankName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
      accountNumber: '12010009876543',
      accountHolder: 'TRAN THI MY KIM',
      isMatchedWithName: true
    },
    documents: [
      {
        id: 'doc-201',
        type: 'BUSINESS_LICENSE',
        title: 'Giấy chứng nhận Đăng ký Hộ kinh doanh',
        fileName: 'DKKD_HoKinhDoanh_MyKim.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
        uploadedAt: '17/09/2026 14:10',
        status: 'VERIFIED',
        ocrData: {
          'Mã số HKD': '41C8019842',
          'Tên hộ KD': 'HỘ KINH DOANH BÁCH HÓA MỸ KIM',
          'Đại diện': 'TRẦN THỊ MỸ KIM',
          'Ngày cấp': '12/03/2022',
          'Nơi cấp': 'UBND Quận 3, TP.HCM'
        }
      },
      {
        id: 'doc-202',
        type: 'VNEID_CARD_FRONT',
        title: 'CCCD VNeID Chủ hộ kinh doanh',
        fileName: 'CCCD_TranThiMyKim.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800&auto=format&fit=crop',
        uploadedAt: '17/09/2026 14:12',
        status: 'VERIFIED',
        ocrData: {
          'Số CCCD': '079185012398',
          'Họ và tên': 'TRẦN THỊ MỸ KIM',
          'Ngày sinh': '22/11/1985'
        }
      }
    ],
    totalProducts: 120,
    rating: 0,
    gmv: 0,
    walletBalance: 0,
    commissionRate: 4.5,
    joinDate: '17/09/2026',
    partnerCategory: 'dealer',
    activeModules: ['orders', 'pim', 'ipos', 'scm']
  },
  {
    id: 'SEL-VN-003',
    shopName: 'Công ty Cổ phần Công nghệ DigiTech Việt Nam',
    legalType: 'ENTERPRISE',
    representativeName: 'HOÀNG MINH ĐỨC',
    phone: '028 3822 9999',
    email: 'contact@digitechvn.com',
    businessAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP.HCM',
    warehouseAddress: 'Tổng kho Tân Bình, 102 Trường Chinh, P.15, Q. Tân Bình, TP.HCM',
    status: 'active',
    vneid: {
      citizenId: '001088019922',
      fullName: 'HOÀNG MINH ĐỨC',
      dob: '08/04/1988',
      gender: 'Nam',
      permanentAddress: 'Quận Cầu Giấy, Hà Nội',
      level: 2,
      verifiedAt: '10/08/2026 11:20:00',
      qrVerified: true,
      matchRate: 100
    },
    tax: {
      taxCode: '0315897621',
      registeredName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ DIGITECH VIỆT NAM',
      taxStatus: 'ACTIVE',
      vatRate: 10.0,
      pitRate: 0.0,
      invoiceType: 'SELLER_ISSUES_INVOICE',
      taxOffice: 'Cục Thuế TP. Hồ Chí Minh'
    },
    bank: {
      bankName: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)',
      accountNumber: '19034567891011',
      accountHolder: 'CONG TY CP CONG NGHE DIGITECH VIET NAM',
      isMatchedWithName: true
    },
    documents: [
      {
        id: 'doc-301',
        type: 'BUSINESS_LICENSE',
        title: 'Giấy chứng nhận Đăng ký Doanh nghiệp (ERC)',
        fileName: 'ERC_DigiTech_VietNam.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
        uploadedAt: '10/08/2026 10:45',
        status: 'VERIFIED',
        ocrData: {
          'Mã số DN': '0315897621',
          'Tên DN': 'CÔNG TY CỔ PHẦN CÔNG NGHỆ DIGITECH VIỆT NAM',
          'Người đại diện': 'HOÀNG MINH ĐỨC',
          'Vốn điều lệ': '20,000,000,000 VNĐ',
          'Ngày thành lập': '15/05/2019'
        }
      },
      {
        id: 'doc-302',
        type: 'AUTHORIZATION_LETTER',
        title: 'Thông báo phát hành Hóa đơn điện tử VAT',
        fileName: 'TB_HoaDonDienTu_DigiTech.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
        uploadedAt: '10/08/2026 10:48',
        status: 'VERIFIED',
        ocrData: {
          'Mẫu số': '1/001',
          'Ký hiệu': 'C26TDT',
          'Nhà cung cấp hóa đơn': 'MISA meInvoice'
        }
      }
    ],
    totalProducts: 1450,
    rating: 4.9,
    gmv: 5800000000,
    walletBalance: 420000000,
    commissionRate: 3.5,
    joinDate: '10/08/2026',
    reviewedBy: 'Trưởng ban Thẩm định Compliance VComm',
    reviewedAt: '11/08/2026 09:15',
    partnerCategory: 'seller',
    activeModules: ['orders', 'pim', 'marketing', 'flashsale', 'affiliate']
  },
  {
    id: 'SEL-VN-004',
    shopName: 'Gia Dụng Thông Minh Homie Life',
    legalType: 'INDIVIDUAL',
    representativeName: 'VŨ THỊ LAN ANH',
    phone: '0988 123 999',
    email: 'lananh.homie@gmail.com',
    businessAddress: '24 Đường D2, Phường 25, Quận Bình Thạnh, TP.HCM',
    warehouseAddress: '24 Đường D2, Phường 25, Quận Bình Thạnh, TP.HCM',
    status: 'active',
    vneid: {
      citizenId: '038194005112',
      fullName: 'VŨ THỊ LAN ANH',
      dob: '05/06/1994',
      gender: 'Nữ',
      permanentAddress: 'Thanh Hóa',
      level: 2,
      verifiedAt: '02/09/2026 15:40:00',
      qrVerified: true,
      matchRate: 100
    },
    tax: {
      taxCode: '8491029381',
      registeredName: 'VŨ THỊ LAN ANH',
      taxStatus: 'ACTIVE',
      vatRate: 1.0,
      pitRate: 0.5,
      invoiceType: 'PLATFORM_WITHHOLDING',
      taxOffice: 'Chi cục Thuế Quận Bình Thạnh'
    },
    bank: {
      bankName: 'Ngân hàng Quân Đội (MB Bank)',
      accountNumber: '0988123999999',
      accountHolder: 'VU THI LAN ANH',
      isMatchedWithName: true
    },
    documents: [
      {
        id: 'doc-401',
        type: 'VNEID_CARD_FRONT',
        title: 'CCCD VNeID Mặt trước',
        fileName: 'CCCD_VuThiLanAnh.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800&auto=format&fit=crop',
        uploadedAt: '02/09/2026 15:35',
        status: 'VERIFIED'
      }
    ],
    totalProducts: 230,
    rating: 4.8,
    gmv: 890000000,
    walletBalance: 65000000,
    commissionRate: 6.0,
    joinDate: '02/09/2026',
    reviewedBy: 'Chuyên viên Onboarding Sàn VComm',
    reviewedAt: '03/09/2026 10:00',
    partnerCategory: 'seller',
    activeModules: ['orders', 'pim', 'marketing']
  },
  {
    id: 'SEL-VN-005',
    shopName: 'Nhà Máy Sản Xuất Đồ Da Tân Á (M2C)',
    legalType: 'ENTERPRISE',
    representativeName: 'PHẠM VĂN ĐỒNG',
    phone: '0274 3888 777',
    email: 'dong.pv@tanaleather.vn',
    businessAddress: 'KCN VSIP 1, TP. Thuận An, Tỉnh Bình Dương',
    warehouseAddress: 'Tổng kho Nhà máy Tân Á, KCN VSIP 1, Bình Dương',
    status: 'pending',
    vneid: {
      citizenId: '074080004521',
      fullName: 'PHẠM VĂN ĐỒNG',
      dob: '19/10/1980',
      gender: 'Nam',
      permanentAddress: 'Bình Dương',
      level: 2,
      verifiedAt: '18/09/2026 11:05:00',
      qrVerified: true,
      matchRate: 100
    },
    tax: {
      taxCode: '3702891234',
      registeredName: 'CÔNG TY TNHH SẢN XUẤT ĐỒ DA TÂN Á',
      taxStatus: 'ACTIVE',
      vatRate: 8.0,
      pitRate: 0.0,
      invoiceType: 'SELLER_ISSUES_INVOICE',
      taxOffice: 'Cục Thuế Tỉnh Bình Dương'
    },
    bank: {
      bankName: 'Ngân hàng TMCP Công Thương Việt Nam (VietinBank)',
      accountNumber: '112000889966',
      accountHolder: 'CONG TY TNHH SX DO DA TAN A',
      isMatchedWithName: true
    },
    documents: [
      {
        id: 'doc-501',
        type: 'BUSINESS_LICENSE',
        title: 'Giấy chứng nhận ĐKDN Công ty TNHH',
        fileName: 'GPKD_TanALeather.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
        uploadedAt: '18/09/2026 11:00',
        status: 'VERIFIED',
        ocrData: {
          'Mã số DN': '3702891234',
          'Tên DN': 'CÔNG TY TNHH SẢN XUẤT ĐỒ DA TÂN Á',
          'Người đại diện': 'PHẠM VĂN ĐỒNG',
          'Vốn điều lệ': '50,000,000,000 VNĐ'
        }
      }
    ],
    totalProducts: 65,
    rating: 0,
    gmv: 0,
    walletBalance: 0,
    commissionRate: 2.5,
    joinDate: '18/09/2026',
    partnerCategory: 'factory',
    activeModules: ['scm', 'pim', 'marketing']
  },
  {
    id: 'SEL-VN-006',
    shopName: 'Hộ KD Tiệm Bánh Ngọt Pháp Bonjour',
    legalType: 'HOUSEHOLD',
    representativeName: 'LÊ THỊ THU HÀ',
    phone: '0933 555 888',
    email: 'bonjourbakery@gmail.com',
    businessAddress: '88 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
    warehouseAddress: '88 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
    status: 'suspended',
    rejectionReason: 'Giấy chứng nhận vệ sinh an toàn thực phẩm hết hạn, yêu cầu cung cấp bản gia hạn mới nhất.',
    vneid: {
      citizenId: '079190009988',
      fullName: 'LÊ THỊ THU HÀ',
      dob: '14/02/1990',
      gender: 'Nữ',
      permanentAddress: 'Quận 2, TP.HCM',
      level: 2,
      verifiedAt: '05/09/2026 16:20:00',
      qrVerified: true,
      matchRate: 100
    },
    tax: {
      taxCode: '0316778899',
      registeredName: 'HỘ KINH DOANH TIỆM BÁNH BONJOUR',
      taxStatus: 'ACTIVE',
      vatRate: 1.0,
      pitRate: 0.5,
      invoiceType: 'PLATFORM_WITHHOLDING',
      taxOffice: 'Chi cục Thuế TP. Thủ Đức'
    },
    bank: {
      bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
      accountNumber: '888899991234',
      accountHolder: 'LE THI THU HA',
      isMatchedWithName: true
    },
    documents: [
      {
        id: 'doc-601',
        type: 'BUSINESS_LICENSE',
        title: 'Giấy phép Hộ kinh doanh',
        fileName: 'GPKD_Bonjour.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
        uploadedAt: '05/09/2026 16:15',
        status: 'VERIFIED'
      }
    ],
    totalProducts: 40,
    rating: 4.6,
    gmv: 240000000,
    walletBalance: 12500000,
    commissionRate: 5.0,
    joinDate: '05/09/2026',
    partnerCategory: 'dealer',
    activeModules: ['ipos', 'pim', 'orders']
  }
];
