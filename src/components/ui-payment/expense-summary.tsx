import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Expense, TimeFrame } from "@/lib/types"
import {
  calculateTotalExpenses,
  formatCurrency,
  groupExpensesByCategory,
} from "@/lib/utils"
import { CATEGORY_COLORS, CATEGORY_COLORS_2 } from "@/lib/constants"
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ShoppingBagIcon,
  BookOpenIcon,
  PiggyBankIcon,
  TrendingUpIcon,
  GiftIcon,
  CoinsIcon,
  ShoppingCartIcon,
  CalendarIcon,
  PaletteIcon,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import "../css/tabs-custom.css"

// Map của danh mục chính đến icon tương ứng
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Chi tiêu thiết yếu": <ShoppingCartIcon className="w-5 h-5" />,
  "Mua sắm giải trí": <ShoppingBagIcon className="w-5 h-5" />,
  "Giáo dục và y tế": <BookOpenIcon className="w-5 h-5" />,
  "Tiết kiệm": <PiggyBankIcon className="w-5 h-5" />,
  "Đầu tư": <TrendingUpIcon className="w-5 h-5" />,
  "Chi khác": <GiftIcon className="w-5 h-5" />,
  "Tiền vay": <CoinsIcon className="w-5 h-5" />,
}

interface ExpenseSummaryProps {
  expenses: Expense[]
  defaultTimeFrame?: TimeFrame
  onTimeFrameChange?: (timeFrame: TimeFrame) => void
  onPercentageChange?: (percentage: number) => void
}

export function ExpenseSummary({
  expenses,
  defaultTimeFrame = "month",
  onTimeFrameChange,
  onPercentageChange,
}: ExpenseSummaryProps) {
  const [timeFrame, setTimeFrame] = React.useState<TimeFrame>(defaultTimeFrame)
  const [isFullColorMode, setIsFullColorMode] = React.useState(false)

  // Load color mode from localStorage on mount
  React.useEffect(() => {
    const savedColorMode = localStorage.getItem("expenseColorMode")
    if (savedColorMode) {
      setIsFullColorMode(JSON.parse(savedColorMode))
    }
  }, [])

  // Save color mode to localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem("expenseColorMode", JSON.stringify(isFullColorMode))
  }, [isFullColorMode])

  // Helper function to get date range for current period
  const getCurrentPeriodRange = (timeFrame: TimeFrame) => {
    const now = new Date()
    const startDate = new Date()

    switch (timeFrame) {
      case "week":
        // Tìm thứ 2 của tuần hiện tại
        const dayOfWeek = now.getDay() // 0 = Chủ nhật, 1 = Thứ 2...
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Số ngày từ thứ 2
        startDate.setDate(now.getDate() - daysFromMonday)
        startDate.setHours(0, 0, 0, 0)
        break
      case "month":
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        break
      case "year":
        startDate.setMonth(0, 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case "all":
      default:
        return null
    }

    return { startDate, endDate: now }
  }

  // Helper function to get date range for previous period
  const getPreviousPeriodRange = (timeFrame: TimeFrame) => {
    const now = new Date()

    switch (timeFrame) {
      case "week": {
        // Tìm thứ 2 của tuần trước
        const dayOfWeek = now.getDay()
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        const thisWeekMonday = new Date(now)
        thisWeekMonday.setDate(now.getDate() - daysFromMonday)

        const prevWeekMonday = new Date(thisWeekMonday)
        prevWeekMonday.setDate(thisWeekMonday.getDate() - 7)
        prevWeekMonday.setHours(0, 0, 0, 0)

        const prevWeekSunday = new Date(prevWeekMonday)
        prevWeekSunday.setDate(prevWeekMonday.getDate() + 6)
        prevWeekSunday.setHours(23, 59, 59, 999)

        return { startDate: prevWeekMonday, endDate: prevWeekSunday }
      }
      case "month": {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        lastDayPrevMonth.setHours(23, 59, 59, 999)

        return { startDate: prevMonth, endDate: lastDayPrevMonth }
      }
      case "year": {
        const prevYear = new Date(now.getFullYear() - 1, 0, 1)
        const lastDayPrevYear = new Date(now.getFullYear() - 1, 11, 31)
        lastDayPrevYear.setHours(23, 59, 59, 999)

        return { startDate: prevYear, endDate: lastDayPrevYear }
      }
      default:
        return null
    }
  }

  // Filter expenses based on selected timeFrame
  const filteredExpenses = React.useMemo(() => {
    const currentRange = getCurrentPeriodRange(timeFrame)
    if (!currentRange) return expenses

    const { startDate } = currentRange
    return expenses.filter(
      (expense) => new Date(expense.timestamp) >= startDate
    )
  }, [expenses, timeFrame])

  // Calculate previous period expenses
  const previousPeriodExpenses = React.useMemo(() => {
    const prevRange = getPreviousPeriodRange(timeFrame)
    if (!prevRange) return []

    const { startDate, endDate } = prevRange
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.timestamp)
      return expenseDate >= startDate && expenseDate <= endDate
    })
  }, [expenses, timeFrame])

  const totalExpenses = calculateTotalExpenses(filteredExpenses)
  const previousTotalExpenses = calculateTotalExpenses(previousPeriodExpenses)

  // Calculate percentage change
  const percentageChange = React.useMemo(() => {
    if (timeFrame === "all") return 0
    if (previousTotalExpenses === 0) {
      return totalExpenses > 0 ? 100 : 0
    }
    const change =
      ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100

    // Debug log - bạn có thể mở browser console để xem
    if (timeFrame === "week") {
      const currentRange = getCurrentPeriodRange(timeFrame)
      const prevRange = getPreviousPeriodRange(timeFrame)
      console.log("=== DEBUG TUẦN ===")
      console.log(
        "Tuần này:",
        currentRange?.startDate.toLocaleDateString(),
        "đến",
        new Date().toLocaleDateString()
      )
      console.log(
        "Tuần trước:",
        prevRange?.startDate.toLocaleDateString(),
        "đến",
        prevRange?.endDate.toLocaleDateString()
      )
      console.log("Chi tiêu tuần này:", totalExpenses)
      console.log("Chi tiêu tuần trước:", previousTotalExpenses)
      console.log("Phần trăm thay đổi:", change)
      console.log("Số expenses tuần này:", filteredExpenses.length)
      console.log("Số expenses tuần trước:", previousPeriodExpenses.length)
    }

    return change
  }, [
    totalExpenses,
    previousTotalExpenses,
    timeFrame,
    filteredExpenses.length,
    previousPeriodExpenses.length,
  ])

  // Group expenses by category
  const categoriesData = groupExpensesByCategory(filteredExpenses)

  // Sort categories by amount (descending)
  const sortedCategories = Object.entries(categoriesData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)

  // Time frame labels (static, in Vietnamese)
  const timeFrameLabel = {
    week: "tuần này",
    month: "tháng này",
    year: "năm này",
    all: "tất cả thời gian",
  }[timeFrame]

  const previousTimeFrameLabel = {
    week: "tuần trước",
    month: "tháng trước",
    year: "năm trước",
    all: "",
  }[timeFrame]

  // Notify parent component about changes
  React.useEffect(() => {
    if (onTimeFrameChange) {
      onTimeFrameChange(timeFrame)
    }
  }, [timeFrame, onTimeFrameChange])

  React.useEffect(() => {
    if (onPercentageChange) {
      onPercentageChange(percentageChange)
    }
  }, [percentageChange, onPercentageChange])

  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value as TimeFrame)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-2xl font-bold mb-2 sm:mb-0">Tổng quan chi tiêu</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullColorMode(!isFullColorMode)}
            className={cn(
              "flex items-center gap-2 cursor-pointer hover:text-none transition-all duration-500 hover:scale-101",
              isFullColorMode &&
                "text-white bg-linear-65 from-purple-500 to-pink-500 hover:bg-linear-to-bl from-violet-500 to-fuchsia-500"
            )}
          >
            <PaletteIcon className="w-4 h-4" />
            {isFullColorMode ? "Chế độ màu sắc" : "Chế độ thường"}
          </Button>
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <Tabs
              value={timeFrame}
              onValueChange={handleTimeFrameChange}
              className="w-full"
            >
              <TabsList className="custom-tabs-list">
                <TabsTrigger className="custom-tab-trigger" value="week">
                  Tuần này
                </TabsTrigger>
                <TabsTrigger className="custom-tab-trigger" value="month">
                  Tháng này
                </TabsTrigger>
                <TabsTrigger className="custom-tab-trigger" value="year">
                  Năm này
                </TabsTrigger>
                <TabsTrigger className="custom-tab-trigger" value="all">
                  Tất cả
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`overflow-hidden border-l-4 border-[var(--primary-color)] ${
            isFullColorMode
              ? "text-[var(--primary-color)] "
              : "bg-white bg-opacity-20"
          }`}
        >
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              Tổng chi tiêu {timeFrameLabel}
            </div>
            <div className="text-2xl font-bold ">
              {formatCurrency(totalExpenses)}
            </div>
            {timeFrame !== "all" && (
              <div className="flex items-center mt-2 text-sm">
                {(() => {
                  console.log(
                    "RENDER CHECK - percentageChange:",
                    percentageChange,
                    "Type:",
                    typeof percentageChange
                  )
                  if (percentageChange > 0) {
                    return (
                      <>
                        <ArrowUpIcon className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-red-500">
                          +{percentageChange.toFixed(1)}%
                        </span>
                      </>
                    )
                  } else if (percentageChange < 0) {
                    return (
                      <>
                        <ArrowDownIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500">
                          {percentageChange.toFixed(1)}%
                        </span>
                      </>
                    )
                  } else {
                    return <span className="text-gray-500">0.0%</span>
                  }
                })()}
                <span className="ml-1 text-muted-foreground">
                  so với {previousTimeFrameLabel}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {sortedCategories.length > 0 ? (
          sortedCategories.map(([category, amount]) => {
            const categoryColor =
              CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
              "#888"
            const categoryColor2 =
              CATEGORY_COLORS_2[category as keyof typeof CATEGORY_COLORS_2] ||
              "#888"

            return (
              <Card
                key={category}
                className={`overflow-hidden transition-all duration-300 ${
                  isFullColorMode ? "" : "border-l-4"
                }`}
                style={{
                  ...(isFullColorMode
                    ? {
                        backgroundColor: categoryColor,
                        boxShadow: `0 4px 20px ${categoryColor}66`,
                      }
                    : { borderLeftColor: categoryColor }),
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center ${
                          isFullColorMode ? "bg-white bg-opacity-20" : ""
                        }`}
                        style={
                          isFullColorMode
                            ? undefined
                            : { backgroundColor: categoryColor }
                        }
                      >
                        <div
                          style={
                            isFullColorMode
                              ? { color: categoryColor }
                              : { color: "white" }
                          }
                        >
                          {CATEGORY_ICONS[category] || (
                            <ShoppingBagIcon className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                      <div
                        className="text-sm font-medium"
                        style={isFullColorMode ? { color: "white" } : undefined}
                      >
                        {category}
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-2xl font-bold mt-2"
                    style={isFullColorMode ? { color: "white" } : undefined}
                  >
                    {formatCurrency(amount)}
                  </div>
                  <div
                    className={`text-sm mt-1 ${
                      isFullColorMode ? "" : "text-muted-foreground"
                    }`}
                    style={
                      isFullColorMode
                        ? { color: "white", opacity: 0.8 }
                        : undefined
                    }
                  >
                    {((amount / totalExpenses) * 100).toFixed(1)}% tổng chi tiêu
                  </div>
                  <div
                    className={`w-full shadow-2xl rounded-full h-1.5 mt-2 ${
                      isFullColorMode ? "bg-white" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(amount / totalExpenses) * 100}%`,
                        backgroundColor: isFullColorMode
                          ? categoryColor2
                          : categoryColor,
                        opacity: isFullColorMode ? 0.8 : 1,
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 flex items-center justify-center h-32">
              <p className="text-muted-foreground text-center">
                Không có dữ liệu chi tiêu trong {timeFrameLabel}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
