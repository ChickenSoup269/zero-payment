"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  //Users,
  Settings,
  ChevronRight,
  ChevronDown,
  BarChart2,
  // FileText,
  Sun,
  Palette,
  Type,
  Globe,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Types
interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  subItems?: NavItem[]
}

// Theme and settings context (simplified for demo)
interface Settings {
  theme: "light" | "dark"
  color: "blue" | "green" | "red"
  font: "inter" | "roboto" | "open-sans"
  language: "vi" | "en"
  currency: "VND" | "USD"
}

// Navigation items
const getNavItems = (t: (key: string) => string): NavItem[] => [
  {
    label: t("Dashboard"),
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: "/",
  },
  {
    label: t("Tasks"),
    icon: <BarChart2 className="h-5 w-5" />,
    href: "/tasks",
  },
  {
    label: t("Giá vàng"),
    icon: <BarChart2 className="h-5 w-5" />,
    href: "/lmao",
  },
]

// NavItem component
const NavItem: React.FC<{
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  level?: number
}> = ({ item, isActive, isCollapsed, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <a
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          isCollapsed ? "justify-center" : level > 0 && "pl-10"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {item.icon}
        {!isCollapsed && <span>{item.label}</span>}
        {!isCollapsed && item.subItems && (
          <button onClick={() => setIsOpen(!isOpen)} className="ml-auto">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
      </a>
      {!isCollapsed && item.subItems && isOpen && (
        <div className="mt-1">
          {item.subItems.map((subItem) => (
            <NavItem
              key={subItem.href}
              item={subItem}
              isActive={false}
              isCollapsed={isCollapsed}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Main Sidebar component
const AdminSidebar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    theme: "light",
    color: "blue",
    font: "inter",
    language: "vi",
    currency: "VND",
  })
  const currentPath = "/" // Should come from router

  // Apply theme and font
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(settings.theme)
    document.documentElement.style.setProperty(
      "--primary-color",
      getColorValue(settings.color)
    )
    document.documentElement.style.fontFamily = getFontValue(settings.font)
  }, [settings.theme, settings.color, settings.font])

  // Handle language change
  const changeLanguage = (lang: "vi" | "en") => {
    i18n.changeLanguage(lang)
    setSettings((prev) => ({ ...prev, language: lang }))
  }

  // Handle theme, color, font, currency changes
  const handleThemeChange = (theme: "light" | "dark") => {
    setSettings((prev) => ({ ...prev, theme }))
  }

  const handleColorChange = (color: "blue" | "green" | "red") => {
    setSettings((prev) => ({ ...prev, color }))
  }

  const handleFontChange = (font: "inter" | "roboto" | "open-sans") => {
    setSettings((prev) => ({ ...prev, font }))
  }

  // Utility functions for theme
  const getColorValue = (color: string) => {
    const colors = {
      blue: "#3B82F6",
      green: "#10B981",
      red: "#EF4444",
    }
    return colors[color] || colors.blue
  }

  const getFontValue = (font: string) => {
    const fonts = {
      inter: "Inter, sans-serif",
      roboto: "Roboto, sans-serif",
      "open-sans": "Open Sans, sans-serif",
    }
    return fonts[font] || fonts.inter
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-screen flex flex-col border-r bg-background transition-all duration-300 z-50",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold">{t("admin_panel")}</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={isCollapsed ? "mx-auto" : ""}
        >
          <ChevronRight
            className={cn("h-5 w-5", isCollapsed && "rotate-180")}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {getNavItems(t).map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={currentPath === item.href}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Settings Dropdown */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-center",
                !isCollapsed && "justify-start"
              )}
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">{t("settings")}</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {/* Theme */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="mr-2 h-4 w-4" />
                {t("theme")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                  {t("light")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                  {t("dark")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Color */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette className="mr-2 h-4 w-4" />
                {t("color")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleColorChange("blue")}>
                  {t("blue")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleColorChange("green")}>
                  {t("green")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleColorChange("red")}>
                  {t("red")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Font */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Type className="mr-2 h-4 w-4" />
                {t("font")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleFontChange("inter")}>
                  Inter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFontChange("roboto")}>
                  Roboto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFontChange("open-sans")}>
                  Open Sans
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Language */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe className="mr-2 h-4 w-4" />
                {t("language")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => changeLanguage("vi")}>
                  Tiếng Việt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                  English
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default AdminSidebar
