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
  const [previousPeriodExpenses, setPreviousPeriodExpenses] = React.useState<
    Expense[]
  >([])
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

  // Calculate previous period expenses
  React.useEffect(() => {
    const now = new Date()
    const previousPeriodStart = new Date()

    switch (timeFrame) {
      case "week":
        previousPeriodStart.setDate(now.getDate() - 7)
        break
      case "month":
        previousPeriodStart.setMonth(now.getMonth() - 1)
        break
      case "year":
        previousPeriodStart.setFullYear(now.getFullYear() - 1)
        break
      default:
        // For 'all', we don't have a previous period
        return
    }

    const previousPeriod = expenses.filter((expense) => {
      const expenseDate = new Date(expense.timestamp)
      return (
        expenseDate >= previousPeriodStart &&
        expenseDate <
          new Date(
            previousPeriodStart.getTime() +
              (now.getTime() - previousPeriodStart.getTime())
          )
      )
    })

    setPreviousPeriodExpenses(previousPeriod)
  }, [expenses, timeFrame])

  // Filter expenses based on selected timeFrame
  const filteredExpenses = React.useMemo(() => {
    const now = new Date()
    const startDate = new Date()

    switch (timeFrame) {
      case "week":
        const dayOfWeek = now.getDay()
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        startDate.setDate(diff)
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
        return expenses
    }

    return expenses.filter(
      (expense) => new Date(expense.timestamp) >= startDate
    )
  }, [expenses, timeFrame])

  const totalExpenses = calculateTotalExpenses(filteredExpenses)
  const previousTotalExpenses = calculateTotalExpenses(previousPeriodExpenses)

  // Calculate percentage change
  const percentageChange =
    previousTotalExpenses === 0
      ? 100
      : ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100

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
        <Card className="overflow-hidden border-l-4 border-[var(--primary-color)">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground bg">
              Tổng chi tiêu {timeFrameLabel}
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            {timeFrame !== "all" && (
              <div className="flex items-center mt-2 text-sm">
                {percentageChange > 0 ? (
                  <>
                    <ArrowUpIcon className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-red-500">
                      {percentageChange.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500">
                      {Math.abs(percentageChange).toFixed(1)}%
                    </span>
                  </>
                )}
                <span className="ml-1 text-muted-foreground">
                  so với kỳ trước
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
