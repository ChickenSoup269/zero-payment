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

// NavItem component (unchanged)
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
    document.documentElement.classList.remove(
      "light",
      "dark",
      "pixel-tree-light",
      "pixel-tree-dark"
    )
    document.documentElement.classList.add(settings.theme)
    document.documentElement.style.setProperty(
      "--primary-color",
      settings.theme.startsWith("pixel-tree")
        ? THEME_PIXEL_TREE[
            settings.theme === "pixel-tree-light" ? "light" : "dark"
          ].primary
        : getColorValue(settings.color)
    )
    document.documentElement.style.setProperty(
      "--secondary-color",
      settings.theme.startsWith("pixel-tree")
        ? THEME_PIXEL_TREE[
            settings.theme === "pixel-tree-light" ? "light" : "dark"
          ].secondary
        : getColorValue(settings.color)
    )
    document.documentElement.style.setProperty(
      "--background-color",
      settings.theme.startsWith("pixel-tree")
        ? THEME_PIXEL_TREE[
            settings.theme === "pixel-tree-light" ? "light" : "dark"
          ].background
        : settings.theme === "light"
        ? "#FFFFFF"
        : "#1F2937"
    )
    document.documentElement.style.setProperty(
      "--text-color",
      settings.theme.startsWith("pixel-tree")
        ? THEME_PIXEL_TREE[
            settings.theme === "pixel-tree-light" ? "light" : "dark"
          ].text
        : settings.theme === "light"
        ? "#000000"
        : "#FFFFFF"
    )
    document.documentElement.style.setProperty(
      "--border-color",
      settings.theme.startsWith("pixel-tree")
        ? THEME_PIXEL_TREE[
            settings.theme === "pixel-tree-light" ? "light" : "dark"
          ].border
        : settings.theme === "light"
        ? "#E5E7EB"
        : "#374151"
    )
    document.documentElement.style.fontFamily = getFontValue(settings.font)
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
          "fixed top-0 left-0 h-screen flex flex-col border-r bg-[var(--background-color)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background-color)]/60 transition-all duration-300 z-50",
          isCollapsed ? "w-16" : "w-72",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottomColor: "var(--border-color)" }}
        >
          {!isCollapsed && (
            <h1
              className="text-lg font-semibold bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] bg-clip-text text-transparent"
              style={{ fontFamily: getFontValue(settings.font) }}
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
        <div
          className="border-t p-3"
          style={{ borderTopColor: "var(--border-color)" }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full transition-all duration-200",
                  isCollapsed ? "justify-center px-0" : "justify-start",
                  "border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-color)]/20"
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
              className="w-56"
              align="end"
              style={{
                backgroundColor: "var(--background-color)",
                color: "var(--text-color)",
                borderColor: "var(--border-color)",
              }}
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
                <DropdownMenuSubContent
                  style={{
                    backgroundColor: "var(--background-color)",
                    color: "var(--text-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <DropdownMenuItem
                    onClick={() => handleThemeChange("light")}
                    className={cn(
                      settings.theme === "light" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleThemeChange("dark")}
                    className={cn(
                      settings.theme === "dark" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleThemeChange("pixel-tree-light")}
                    className={cn(
                      settings.theme === "pixel-tree-light" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Pixel Tree Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleThemeChange("pixel-tree-dark")}
                    className={cn(
                      settings.theme === "pixel-tree-dark" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Pixel Tree Dark
                  </DropdownMenuItem>
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
                <DropdownMenuSubContent
                  style={{
                    backgroundColor: "var(--background-color)",
                    color: "var(--text-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <DropdownMenuItem
                    onClick={() => handleColorChange("blue")}
                    className={cn(
                      settings.color === "blue" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Blue
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleColorChange("green")}
                    className={cn(
                      settings.color === "green" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Green
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleColorChange("red")}
                    className={cn(
                      settings.color === "red" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Red
                  </DropdownMenuItem>
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
                <DropdownMenuSubContent
                  style={{
                    backgroundColor: "var(--background-color)",
                    color: "var(--text-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <DropdownMenuItem
                    onClick={() => handleFontChange("inter")}
                    className={cn(
                      settings.font === "inter" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Inter
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFontChange("roboto")}
                    className={cn(
                      settings.font === "roboto" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Roboto
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFontChange("open-sans")}
                    className={cn(
                      settings.font === "open-sans" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Open Sans
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFontChange("gohu-nerd")}
                    className={cn(
                      settings.font === "gohu-nerd" &&
                        "bg-[var(--secondary-color)]/20 text-[var(--text-color)]",
                      "hover:bg-[var(--secondary-color)]/30"
                    )}
                    style={{ color: "var(--text-color)" }}
                  >
                    Gohu Nerd
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
