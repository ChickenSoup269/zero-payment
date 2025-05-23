"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
// import { Link } from "next/link"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  Settings,
  ChevronRight,
  ChevronDown,
  BarChart2,
  Sun,
  Palette,
  Type,
  Globe,
  Menu,
  X,
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
    href: "/api/gold-price",
  },
]

// NavItem component
const NavItem: React.FC<{
  item: NavItem
  currentPath: string
  isCollapsed: boolean
  level?: number
  onNavigate?: () => void
}> = ({ item, currentPath, isCollapsed, level = 0, onNavigate }) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // Check if current item or any sub-item is active
  const isActive = currentPath === item.href
  const hasActiveSubItem = item.subItems?.some(
    (subItem) =>
      currentPath === subItem.href || currentPath.startsWith(subItem.href + "/")
  )

  // Auto-expand if has active sub-item
  useEffect(() => {
    if (hasActiveSubItem && !isCollapsed) {
      setIsOpen(true)
    }
  }, [hasActiveSubItem, isCollapsed])

  // Handle navigation
  const handleClick = (e: React.MouseEvent) => {
    if (item.subItems && !isCollapsed) {
      e.preventDefault()
      setIsOpen(!isOpen)
    } else {
      router.push(item.href)
      onNavigate?.()
    }
  }

  return (
    <div className="mb-1">
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 cursor-pointer group",
          isActive || hasActiveSubItem
            ? "bg-primary text-primary-foreground font-medium shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          isCollapsed
            ? "justify-center"
            : level > 0 && "pl-8 ml-4 border-l-2 border-muted",
          level > 0 && (isActive || hasActiveSubItem) && "border-l-primary"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-md transition-colors",
            isActive || hasActiveSubItem
              ? "text-primary-foreground"
              : "group-hover:text-accent-foreground"
          )}
        >
          {item.icon}
        </div>

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.subItems && (
              <div className="flex items-center justify-center w-5 h-5">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sub-items */}
      {!isCollapsed && item.subItems && isOpen && (
        <div className="mt-1 space-y-1">
          {item.subItems.map((subItem) => (
            <NavItem
              key={subItem.href}
              item={subItem}
              currentPath={currentPath}
              isCollapsed={isCollapsed}
              level={level + 1}
              onNavigate={onNavigate}
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
  const pathname = usePathname() // Sử dụng usePathname thay vì router.pathname
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    theme: "light",
    color: "blue",
    font: "inter",
    language: "vi",
    currency: "VND",
  })

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

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

  // Handle theme, color, font changes
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
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getFontValue = (font: string) => {
    const fonts = {
      inter: "Inter, sans-serif",
      roboto: "Roboto, sans-serif",
      "open-sans": "Open Sans, sans-serif",
    }
    return fonts[font as keyof typeof fonts] || fonts.inter
  }

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  const closeMobile = () => {
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={handleMobileToggle}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen flex flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 z-50",
          isCollapsed ? "w-16" : "w-72",
          // Mobile responsive
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t("admin_panel")}
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("hidden lg:flex", isCollapsed ? "mx-auto" : "")}
          >
            <ChevronRight
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                isCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {getNavItems(t).map((item) => (
            <NavItem
              key={item.href}
              item={item}
              currentPath={pathname}
              isCollapsed={isCollapsed}
              onNavigate={closeMobile}
            />
          ))}
        </nav>

        {/* Settings Dropdown */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full transition-all duration-200",
                  isCollapsed ? "justify-center px-0" : "justify-start"
                )}
              >
                <Settings className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">{t("settings")}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
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
                  <DropdownMenuItem
                    onClick={() => handleFontChange("open-sans")}
                  >
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
    </>
  )
}

export default AdminSidebar
