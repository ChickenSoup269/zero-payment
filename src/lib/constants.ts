import { UserData } from "@/lib/types"

// src/lib/constants.ts
export const EXPENSE_CATEGORIES = {
  "Chi tiêu thiết yếu": [
    "Đi chợ siêu thị",
    "Nhà hàng",
    "Chi trả hóa đơn",
    "Tiền nhà",
    "Đi lại",
    "Giúp việc",
    "Khác",
  ],
  "Mua sắm giải trí": [
    "Vui chơi giải trí",
    "Mua sắm",
    "Đồ gia dụng",
    "Làm đẹp thể thao",
    "Khác",
  ],
  "Giáo dục và y tế": ["Giáo dục", "Y tế", "Bảo hiểm", "Khác"],
  "Tiết kiệm": ["Tiết kiệm"],
  "Đầu tư": ["Sự kiện", "Chứng khoán", "Bất động sản", "Quỹ", "Khác"],
  "Chi khác": ["Biếu tặng", "Dịch vụ công", "Khác"],
  "Tiền vay": ["Tiền vay", "Khác"],
}

export const ALL_SUBCATEGORIES = [
  "Đi chợ siêu thị",
  "Nhà hàng",
  "Chi trả hóa đơn",
  "Tiền nhà",
  "Đi lại",
  "Vui chơi giải trí",
  "Mua sắm",
  "Giáo dục",
  "Y tế",
  "Bảo hiểm",
  "Tiết kiệm",
  "Chứng khoán",
  "Bất động sản",
  "Quỹ",
  "Sự kiện",
  "Biếu tặng",
  "Dịch vụ công",
  "Đồ gia dụng",
  "Giúp việc",
  "Làm đẹp thể thao",
  "Tiền vay",
  "Khác",
]

// Gợi ý mô tả dựa trên danh mục và danh mục con
export const DESCRIPTION_SUGGESTIONS = {
  "Chi tiêu thiết yếu": {
    "Đi chợ siêu thị": [
      "Đi siêu thị mua thực phẩm",
      "Mua đồ dùng nhà bếp",
      "Mua thực phẩm hàng tuần",
    ],
    "Nhà hàng": ["Tiệc tối cùng gia đình", "Ăn tối ngoài", "Ăn trưa công việc"],
    "Chi trả hóa đơn": [
      "Hóa đơn điện tháng",
      "Hóa đơn nước",
      "Hóa đơn internet",
    ],
    "Tiền nhà": [
      "Tiền thuê nhà tháng",
      "Phí quản lý chung cư",
      "Phí bảo trì căn hộ",
    ],
    "Đi lại": ["Tiền xăng xe", "Vé xe buýt", "Phí gửi xe", "Đi grab"],
    "Giúp việc": ["Tiền công giúp việc", "Dịch vụ dọn nhà", "Giặt ủi"],
    Khác: ["Chi phí thiết yếu hàng ngày"],
  },
  "Mua sắm giải trí": {
    "Vui chơi giải trí": [
      "Vé xem phim",
      "Vé concert",
      "Tiền karaoke",
      "Du lịch cuối tuần",
    ],
    "Mua sắm": ["Quần áo mới", "Giày dép", "Phụ kiện thời trang"],
    "Đồ gia dụng": [
      "Mua đồ trang trí nhà",
      "Thiết bị điện tử",
      "Dụng cụ nhà bếp mới",
    ],
    "Làm đẹp thể thao": ["Đăng ký tập gym", "Spa và làm đẹp", "Mỹ phẩm"],
    Khác: ["Chi phí giải trí khác"],
  },
  "Giáo dục và y tế": {
    "Giáo dục": ["Học phí khóa học", "Sách giáo trình", "Phí gia sư"],
    "Y tế": ["Khám bệnh định kỳ", "Thuốc men", "Chi phí nha khoa"],
    "Bảo hiểm": ["Phí bảo hiểm sức khỏe", "Bảo hiểm nhân thọ", "Bảo hiểm xe"],
    Khác: ["Chi phí giáo dục hoặc y tế khác"],
  },
  "Tiết kiệm": {
    "Tiết kiệm": ["Tiết kiệm hàng tháng", "Quỹ dự phòng", "Tiết kiệm mục tiêu"],
  },
  "Đầu tư": {
    "Sự kiện": ["Đầu tư cho sự kiện", "Tổ chức event"],
    "Chứng khoán": ["Mua cổ phiếu", "Quỹ đầu tư", "ETF"],
    "Bất động sản": [
      "Đặt cọc mua nhà",
      "Góp vốn bất động sản",
      "Tiền thuê đất",
    ],
    Quỹ: ["Đóng góp quỹ hưu trí", "Quỹ tín thác"],
    Khác: ["Đầu tư dài hạn khác"],
  },
  "Chi khác": {
    "Biếu tặng": ["Quà sinh nhật", "Quà cưới", "Tiền mừng"],
    "Dịch vụ công": ["Phí hành chính", "Dịch vụ công chứng", "Thủ tục giấy tờ"],
    Khác: ["Chi phí phát sinh khác"],
  },
  "Tiền vay": {
    "Tiền vay": ["Trả góp vay ngân hàng", "Trả nợ", "Vay tạm người thân"],
    Khác: ["Khoản vay khác"],
  },
}

export const CATEGORY_COLORS = {
  "Chi tiêu thiết yếu": "#FF6B6B",
  "Mua sắm giải trí": "#4ECDC4",
  "Giáo dục và y tế": "#FFD166",
  "Tiết kiệm": "#06D6A0",
  "Đầu tư": "#118AB2",
  "Chi khác": "#9775FA",
  "Tiền vay": "#EF4444",
}

export const CATEGORY_COLORS_2 = {
  "Chi tiêu thiết yếu": "#FFB3B3", // nhạt hơn đỏ
  "Mua sắm giải trí": "#A0EDE6", // nhạt hơn xanh ngọc
  "Giáo dục và y tế": "#FFE699", // nhạt hơn vàng
  "Tiết kiệm": "#9FF5C1", // nhạt hơn xanh lá
  "Đầu tư": "#A8D3E5", // nhạt hơn xanh dương
  "Chi khác": "#C6B8F9", // nhạt hơn tím
  "Tiền vay": "#FCA5A5", // đỏ cam nhạt
}

export const THEME_PIXEL_TREE = {
  light: {
    background: "#FFFFFF", // nền trắng cho độ sáng cao
    text: "#000000", // chữ đen cho dễ đọc
    border: "#C4F129", // viền xanh sáng nhẹ, nổi bật
    primary: "#61A53F", // màu xanh lá trung tính cho nút chính
    secondary: "#8FD032", // xanh vàng sáng làm nền phụ
  },
  dark: {
    background: "#1F2937", // nền tối chuẩn
    text: "#FFFFFF", // chữ trắng
    border: "#477238", // viền xanh đậm, dịu mắt trên nền tối
    primary: "#61A53F", // giữ màu consistent với light
    secondary: "#8FD032", // đủ sáng để nổi bật trên dark
  },
}

export const DEFAULT_USER_DATA: UserData = {
  name: "",
  expenses: [],
  created: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
}

export const TIME_FRAME_OPTIONS = [
  { label: "Tuần này", value: "week" },
  { label: "Tháng này", value: "month" },
  { label: "Năm này", value: "year" },
  { label: "Tất cả", value: "all" },
]

export const CHART_TYPE_OPTIONS = [
  { label: "Biểu đồ cột", value: "bar" },
  { label: "Biểu đồ tròn", value: "pie" },
  { label: "Biểu đồ đường", value: "line" },
]
