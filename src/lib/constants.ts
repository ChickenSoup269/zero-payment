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

export const CATEGORY_COLORS = {
  "Chi tiêu thiết yếu": "#FF6B6B",
  "Mua sắm giải trí": "#4ECDC4",
  "Giáo dục và y tế": "#FFD166",
  "Tiết kiệm": "#06D6A0",
  "Đầu tư": "#118AB2",
  "Chi khác": "#9775FA",
  "Tiền vay": "#EF4444",
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
