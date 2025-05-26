"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Settings,
  ChevronRight,
  ChevronDown,
  Sun,
  Palette,
  Type,
  Menu,
  X,
  ChartLine,
  ClipboardList,
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
import { THEME_PIXEL_TREE } from "@/lib/constants"

// Types
interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  subItems?: NavItem[]
}

interface Settings {
  theme: "light" | "dark" | "pixel-tree-light" | "pixel-tree-dark"
  color: "blue" | "green" | "red"
  font: "inter" | "roboto" | "open-sans" | "gohu-nerd"
  currency: "VND" | "USD"
}

// Navigation items
const getNavItems = (): NavItem[] => [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: "/",
  },
  {
    label: "Tasks",
    icon: <ClipboardList className="h-5 w-5" />,
    href: "/tasks",
  },
  {
    label: "Gold Price",
    icon: <ChartLine className="h-5 w-5" />,
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

  const isActive = currentPath === item.href
  const hasActiveSubItem = item.subItems?.some(
    (subItem) =>
      currentPath === subItem.href || currentPath.startsWith(subItem.href + "/")
  )

  useEffect(() => {
    if (hasActiveSubItem && !isCollapsed) {
      setIsOpen(true)
    }
  }, [hasActiveSubItem, isCollapsed])

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
            ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-text font-bold shadow-sm text-white"
            : "text-text hover:bg-secondary/20 hover:text-text",
          isCollapsed
            ? "justify-center"
            : level > 0 && "pl-8 ml-4 border-l-2 border-border",
          level > 0 && (isActive || hasActiveSubItem) && "border-l-primary"
        )}
        style={{ fontFamily: "var(--font-family)" }}
        title={isCollapsed ? item.label : undefined}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-md transition-colors",
            isActive || hasActiveSubItem ? "text-text" : "group-hover:text-text"
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
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    theme: "light",
    color: "blue",
    font: "inter",
    currency: "VND",
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("adminSettings")
    if (savedSettings) {
      const parsedSettings: Settings = JSON.parse(savedSettings)
      setSettings(parsedSettings)
    }
  }, [])

  // Save settings to localStorage and apply theme/font
  useEffect(() => {
    localStorage.setItem("adminSettings", JSON.stringify(settings))
    const root = document.documentElement
    root.classList.remove(
      "light",
      "dark",
      "pixel-tree-light",
      "pixel-tree-dark"
    )
    root.classList.add(settings.theme)

    const isPixelTree = settings.theme.startsWith("pixel-tree")
    const pixelTreeTheme = isPixelTree
      ? THEME_PIXEL_TREE[
          settings.theme === "pixel-tree-light" ? "light" : "dark"
        ]
      : null

    root.style.setProperty(
      "--primary-color",
      isPixelTree ? pixelTreeTheme.primary : getColorValue(settings.color)
    )
    root.style.setProperty(
      "--secondary-color",
      isPixelTree ? pixelTreeTheme.secondary : getColorValue(settings.color)
    )
    root.style.setProperty(
      "--background-color",
      isPixelTree
        ? pixelTreeTheme.background
        : settings.theme === "light"
        ? "#FFFFFF"
        : "#1F2937"
    )
    root.style.setProperty(
      "--text-color",
      isPixelTree
        ? pixelTreeTheme.text
        : settings.theme === "light"
        ? "#1F2937"
        : "#F9FAFB"
    )
    root.style.setProperty(
      "--border-color",
      isPixelTree
        ? pixelTreeTheme.border
        : settings.theme === "light"
        ? "#E5E7EB"
        : "#374151"
    )
    root.style.setProperty("--font-family", getFontValue(settings.font))
  }, [settings])

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Handle theme, color, font changes
  const handleThemeChange = (theme: Settings["theme"]) => {
    setSettings((prev) => ({ ...prev, theme }))
  }

  const handleColorChange = (color: "blue" | "green" | "red") => {
    setSettings((prev) => ({ ...prev, color }))
  }

  const handleFontChange = (font: Settings["font"]) => {
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
      "gohu-nerd": "GohuFontNerd, monospace",
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
        className="fixed top-4 left-4 z-50 lg:hidden border-border text-text hover:bg-secondary/20"
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
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <h1
              className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              style={{ fontFamily: "var(--font-family)" }}
            >
              Admin Panel
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
              style={{ color: "var(--text-color)" }}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {getNavItems().map((item) => (
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
        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full transition-all duration-200 border-border text-text hover:bg-secondary/20",
                  isCollapsed ? "justify-center px-0" : "justify-start"
                )}
              >
                <Settings
                  className="h-4 w-4"
                  style={{ color: "var(--text-color)" }}
                />
                {!isCollapsed && <span className="ml-2">Settings</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-background text-text border-border"
              align="end"
            >
              {/* Theme */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger style={{ color: "var(--text-color)" }}>
                  <Sun
                    className="mr-2 h-4 w-4"
                    style={{ color: "var(--text-color)" }}
                  />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background text-text border-border">
                  {["light", "dark", "pixel-tree-light", "pixel-tree-dark"].map(
                    (theme) => (
                      <DropdownMenuItem
                        key={theme}
                        onClick={() =>
                          handleThemeChange(theme as Settings["theme"])
                        }
                        className={cn(
                          settings.theme === theme &&
                            "bg-secondary/20 text-text",
                          "hover:bg-secondary/30"
                        )}
                        style={{
                          color: "var(--text-color)",
                          fontFamily: "var(--font-family)",
                        }}
                      >
                        {theme
                          .replace("pixel-tree-", "Pixel Tree ")
                          .replace("-", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Color */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger style={{ color: "var(--text-color)" }}>
                  <Palette
                    className="mr-2 h-4 w-4"
                    style={{ color: "var(--text-color)" }}
                  />
                  Color
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background text-text border-border">
                  {["blue", "green", "red"].map((color) => (
                    <DropdownMenuItem
                      key={color}
                      onClick={() =>
                        handleColorChange(color as "blue" | "green" | "red")
                      }
                      className={cn(
                        settings.color === color && "bg-secondary/20 text-text",
                        "hover:bg-secondary/30"
                      )}
                      style={{
                        color: "var(--text-color)",
                        fontFamily: "var(--font-family)",
                      }}
                    >
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Font */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger style={{ color: "var(--text-color)" }}>
                  <Type
                    className="mr-2 h-4 w-4"
                    style={{ color: "var(--text-color)" }}
                  />
                  Font
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background text-text border-border">
                  {["inter", "roboto", "open-sans", "gohu-nerd"].map((font) => (
                    <DropdownMenuItem
                      key={font}
                      onClick={() => handleFontChange(font as Settings["font"])}
                      className={cn(
                        settings.font === font && "bg-secondary/20 text-text",
                        "hover:bg-secondary/30"
                      )}
                      style={{
                        color: "var(--text-color)",
                        fontFamily: "var(--font-family)",
                      }}
                    >
                      {font
                        .replace("open-sans", "Open Sans")
                        .replace("gohu-nerd", "Gohu Nerd")
                        .replace("-", " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </DropdownMenuItem>
                  ))}
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
