import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const resources = {
  en: {
    translation: {
      admin_panel: "Admin Panel",
      dashboard: "Dashboard",
      expenses: "Expenses",
      all_expenses: "All Expenses",
      categories: "Categories",
      analytics: "Analytics",
      reports: "Reports",
      compare: "Compare",
      settings: "Settings",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      color: "Color",
      blue: "Blue",
      green: "Green",
      red: "Red",
      font: "Font",
      language: "Language",
      currency: "Currency",
    },
  },
  vi: {
    translation: {
      admin_panel: "Bảng Quản Trị",
      dashboard: "Bảng Điều Khiển",
      expenses: "Chi Tiêu",
      all_expenses: "Tất Cả Chi Tiêu",
      categories: "Danh Mục",
      analytics: "Phân Tích",
      reports: "Báo Cáo",
      compare: "So Sánh",
      settings: "Cài Đặt",
      theme: "Chủ Đề",
      light: "Sáng",
      dark: "Tối",
      color: "Màu Sắc",
      blue: "Xanh Dương",
      green: "Xanh Lá",
      red: "Đỏ",
      font: "Phông Chữ",
      language: "Ngôn Ngữ",
      currency: "Tiền Tệ",
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: "vi", // Default language
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
