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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import "../css/tabs-custom.css"

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
  onPercentageChange?: (percentage: number | null) => void
}

interface TimePeriod {
  value: string
  label: string
  startDate: Date
  endDate: Date
}

export function ExpenseSummary({
  expenses,
  defaultTimeFrame = "month",
  onTimeFrameChange,
  onPercentageChange,
}: ExpenseSummaryProps) {
  const [timeFrame, setTimeFrame] = React.useState<TimeFrame>(defaultTimeFrame)
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>("current")
  const [isFullColorMode, setIsFullColorMode] = React.useState(false)

  // Load color mode from localStorage
  React.useEffect(() => {
    const savedColorMode = localStorage.getItem("expenseColorMode")
    if (savedColorMode) {
      setIsFullColorMode(JSON.parse(savedColorMode))
    }
  }, [])

  // Save color mode to localStorage
  React.useEffect(() => {
    localStorage.setItem("expenseColorMode", JSON.stringify(isFullColorMode))
  }, [isFullColorMode])

  // Generate available periods
  const getAvailablePeriods = React.useMemo(() => {
    const periods: TimePeriod[] = []
    if (timeFrame === "all") return periods

    const now = new Date()
    const oldestExpense =
      expenses.length > 0
        ? new Date(
            Math.min(...expenses.map((e) => new Date(e.timestamp).getTime()))
          )
        : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    if (timeFrame === "week") {
      const weekStart = new Date(now)
      const dayOfWeek = now.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      weekStart.setDate(now.getDate() - daysFromMonday)
      weekStart.setHours(0, 0, 0, 0)

      let weekNumber = 0
      const weeksToGenerate = Math.max(
        20,
        Math.ceil(
          (now.getTime() - oldestExpense.getTime()) / (7 * 24 * 60 * 60 * 1000)
        ) + 5
      )

      while (weekNumber < weeksToGenerate) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        periods.push({
          value: weekNumber === 0 ? "current" : `week-${weekNumber}`,
          label:
            weekNumber === 0
              ? "Tuần này"
              : weekNumber === 1
              ? "Tuần trước"
              : `Tuần ${weekStart.getDate()}/${weekStart.getMonth() + 1}${
                  weekEnd.getFullYear() !== now.getFullYear()
                    ? `/${weekEnd.getFullYear()}`
                    : ""
                }`,
          startDate: new Date(weekStart),
          endDate: new Date(weekEnd),
        })

        weekStart.setDate(weekStart.getDate() - 7)
        weekNumber++
      }
    } else if (timeFrame === "month") {
      let currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      let monthNumber = 0
      const monthsToGenerate = Math.max(
        12,
        (now.getFullYear() - oldestExpense.getFullYear()) * 12 +
          now.getMonth() -
          oldestExpense.getMonth() +
          3
      )

      while (monthNumber < monthsToGenerate) {
        const monthEnd = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        )
        const monthNames = [
          "Tháng 1",
          "Tháng 2",
          "Tháng 3",
          "Tháng 4",
          "Tháng 5",
          "Tháng 6",
          "Tháng 7",
          "Tháng 8",
          "Tháng 9",
          "Tháng 10",
          "Tháng 11",
          "Tháng 12",
        ]

        periods.push({
          value: monthNumber === 0 ? "current" : `month-${monthNumber}`,
          label:
            monthNumber === 0
              ? "Tháng này"
              : monthNumber === 1
              ? "Tháng trước"
              : `${monthNames[currentMonth.getMonth()]}${
                  currentMonth.getFullYear() !== now.getFullYear()
                    ? ` ${currentMonth.getFullYear()}`
                    : ""
                }`,
          startDate: new Date(currentMonth),
          endDate: monthEnd,
        })

        currentMonth.setMonth(currentMonth.getMonth() - 1)
        monthNumber++
      }
    } else if (timeFrame === "year") {
      let currentYear = now.getFullYear()
      let yearNumber = 0
      const yearsToGenerate = Math.max(
        5,
        now.getFullYear() - oldestExpense.getFullYear() + 2
      )

      while (yearNumber < yearsToGenerate) {
        periods.push({
          value: yearNumber === 0 ? "current" : `year-${yearNumber}`,
          label:
            yearNumber === 0
              ? "Năm này"
              : yearNumber === 1
              ? "Năm trước"
              : `Năm ${currentYear}`,
          startDate: new Date(currentYear, 0, 1),
          endDate: new Date(currentYear, 11, 31, 23, 59, 59, 999),
        })

        currentYear--
        yearNumber++
      }
    }

    return periods
  }, [timeFrame, expenses])

  // Get filtered expenses for current period
  const filteredExpenses = React.useMemo(() => {
    if (timeFrame === "all") return expenses

    const period = getAvailablePeriods.find((p) => p.value === selectedPeriod)
    if (!period) return expenses

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.timestamp)
      return expenseDate >= period.startDate && expenseDate <= period.endDate
    })
  }, [expenses, timeFrame, selectedPeriod, getAvailablePeriods])

  // Get previous period expenses
  const previousPeriodExpenses = React.useMemo(() => {
    if (timeFrame === "all") return []

    const currentPeriodIndex = getAvailablePeriods.findIndex(
      (p) => p.value === selectedPeriod
    )
    let prevPeriod: TimePeriod | null = null

    // Try to get the previous period from available periods
    if (
      currentPeriodIndex >= 0 &&
      currentPeriodIndex < getAvailablePeriods.length - 1
    ) {
      prevPeriod = getAvailablePeriods[currentPeriodIndex + 1]
    } else {
      // Fallback to calculate previous period
      const currentPeriod =
        getAvailablePeriods.find((p) => p.value === selectedPeriod) ||
        getAvailablePeriods[0]
      if (!currentPeriod) return []

      const now = new Date()
      let startDate: Date, endDate: Date

      switch (timeFrame) {
        case "week":
          startDate = new Date(currentPeriod.startDate)
          startDate.setDate(startDate.getDate() - 7)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(startDate)
          endDate.setDate(startDate.getDate() + 6)
          endDate.setHours(23, 59, 59, 999)
          break
        case "month":
          startDate = new Date(
            currentPeriod.startDate.getFullYear(),
            currentPeriod.startDate.getMonth() - 1,
            1
          )
          endDate = new Date(
            currentPeriod.startDate.getFullYear(),
            currentPeriod.startDate.getMonth(),
            0,
            23,
            59,
            59,
            999
          )
          break
        case "year":
          startDate = new Date(currentPeriod.startDate.getFullYear() - 1, 0, 1)
          endDate = new Date(
            currentPeriod.startDate.getFullYear() - 1,
            11,
            31,
            23,
            59,
            59,
            999
          )
          break
        default:
          return []
      }

      prevPeriod = {
        value: `prev-${timeFrame}`,
        label: `Previous ${timeFrame}`,
        startDate,
        endDate,
      }
    }

    console.log("Previous period:", {
      start: prevPeriod.startDate.toISOString(),
      end: prevPeriod.endDate.toISOString(),
      expensesCount: expenses.filter((expense) => {
        const expenseDate = new Date(expense.timestamp)
        return (
          expenseDate >= prevPeriod!.startDate &&
          expenseDate <= prevPeriod!.endDate
        )
      }).length,
    })

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.timestamp)
      return (
        expenseDate >= prevPeriod!.startDate &&
        expenseDate <= prevPeriod!.endDate
      )
    })
  }, [expenses, timeFrame, selectedPeriod, getAvailablePeriods])

  const totalExpenses = calculateTotalExpenses(filteredExpenses)
  const previousTotalExpenses = calculateTotalExpenses(previousPeriodExpenses)

  const percentageChange = React.useMemo(() => {
    if (timeFrame === "all") return null

    console.log("Calculating percentage:", {
      totalExpenses,
      previousTotalExpenses,
      selectedPeriod,
      timeFrame,
    })

    if (previousTotalExpenses === 0) {
      return totalExpenses > 0 ? null : 0 // Return null for new periods with expenses, 0 for no expenses
    }

    const change =
      ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100
    return parseFloat(change.toFixed(1))
  }, [timeFrame, totalExpenses, previousTotalExpenses, selectedPeriod])

  const categoriesData = groupExpensesByCategory(filteredExpenses)
  const sortedCategories = Object.entries(categoriesData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)

  const getCurrentPeriodLabel = () => {
    if (timeFrame === "all") return "tất cả thời gian"
    const period = getAvailablePeriods.find((p) => p.value === selectedPeriod)
    return period
      ? period.label.toLowerCase()
      : {
          week: "tuần này",
          month: "tháng này",
          year: "năm này",
        }[timeFrame]
  }

  const previousTimeFrameLabel = {
    week: "tuần trước",
    month: "tháng trước",
    year: "năm trước",
    all: "",
  }[timeFrame]

  React.useEffect(() => {
    setSelectedPeriod("current")
  }, [timeFrame])

  React.useEffect(() => {
    if (onTimeFrameChange) onTimeFrameChange(timeFrame)
    if (onPercentageChange) onPercentageChange(percentageChange)
  }, [timeFrame, percentageChange, onTimeFrameChange, onPercentageChange])

  return (
    <div className="space-y-4 sm:space-y-6 p-4">
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
        {/* <h2 className="text-xl sm:text-2xl font-bold text-center lg:text-left">
          Tổng quan chi tiêu
        </h2> */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullColorMode(!isFullColorMode)}
            className={cn(
              "flex items-center justify-center gap-2 cursor-pointer hover:text-none transition-all duration-500 hover:scale-101 w-full sm:w-auto",
              isFullColorMode &&
                "text-white bg-linear-65 from-purple-500 to-pink-500 hover:bg-linear-to-bl from-violet-500 to-fuchsia-500"
            )}
          >
            <PaletteIcon className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isFullColorMode ? "Chế độ màu sắc" : "Chế độ thường"}
            </span>
            <span className="sm:hidden">
              {isFullColorMode ? "Màu sắc" : "Thường"}
            </span>
          </Button>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Thời gian:
              </span>
            </div>
            <Tabs
              value={timeFrame}
              onValueChange={setTimeFrame}
              className="w-full sm:w-auto"
            >
              <TabsList className="custom-tabs-list grid grid-cols-4 w-full sm:w-auto">
                <TabsTrigger
                  className="custom-tab-trigger text-xs sm:text-sm"
                  value="week"
                >
                  Tuần
                </TabsTrigger>
                <TabsTrigger
                  className="custom-tab-trigger text-xs sm:text-sm"
                  value="month"
                >
                  Tháng
                </TabsTrigger>
                <TabsTrigger
                  className="custom-tab-trigger text-xs sm:text-sm"
                  value="year"
                >
                  Năm
                </TabsTrigger>
                <TabsTrigger
                  className="custom-tab-trigger text-xs sm:text-sm"
                  value="all"
                >
                  Tất cả
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {timeFrame !== "all" && (
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Chọn kỳ" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailablePeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card
          className={`overflow-hidden border-l-4 border-b-4 border-[var(--primary-color)] col-span-1 sm:col-span-2 lg:col-span-1 ${
            isFullColorMode
              ? "text-[var(--primary-color)]"
              : "bg-white bg-opacity-20"
          }`}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-muted-foreground mb-2">
              Tổng chi tiêu {getCurrentPeriodLabel()}
            </div>
            <div className="text-xl sm:text-2xl font-bold mb-2">
              {formatCurrency(totalExpenses)}
            </div>
            {timeFrame !== "all" && (
              <div className="flex flex-col sm:flex-row sm:items-center mt-2 text-xs sm:text-sm space-y-1 sm:space-y-0">
                {percentageChange === null || previousTotalExpenses === 0 ? (
                  <span className="text-blue-500">
                    Mới (không có dữ liệu trước)
                  </span>
                ) : percentageChange === 0 ? (
                  <span className="text-gray-500">0.0%</span>
                ) : percentageChange > 0 ? (
                  <div className="flex items-center">
                    <ArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
                    <span className="text-red-500">
                      +{percentageChange.toFixed(1)}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                    <span className="text-green-500">
                      {percentageChange.toFixed(1)}%
                    </span>
                  </div>
                )}
                {percentageChange !== null && previousTotalExpenses !== 0 && (
                  <span className="sm:ml-1 text-muted-foreground text-xs sm:text-sm">
                    so với {previousTimeFrameLabel}
                  </span>
                )}
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
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center flex-1 min-w-0">
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0 ${
                          isFullColorMode ? "bg-white bg-opacity-20" : ""
                        }`}
                        style={
                          isFullColorMode
                            ? undefined
                            : { backgroundColor: categoryColor }
                        }
                      >
                        <div
                          className="text-xs sm:text-base"
                          style={
                            isFullColorMode
                              ? { color: categoryColor }
                              : { color: "white" }
                          }
                        >
                          {CATEGORY_ICONS[category] || (
                            <ShoppingBagIcon className="w-3 h-3 sm:w-5 sm:h-5" />
                          )}
                        </div>
                      </div>
                      <div
                        className="text-xs sm:text-sm font-medium truncate"
                        style={isFullColorMode ? { color: "white" } : undefined}
                        title={category}
                      >
                        {category}
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-lg sm:text-2xl font-bold mb-2"
                    style={isFullColorMode ? { color: "white" } : undefined}
                  >
                    {formatCurrency(amount)}
                  </div>
                  <div
                    className={`text-xs sm:text-sm mb-3 ${
                      isFullColorMode ? "" : "text-muted-foreground"
                    }`}
                    style={
                      isFullColorMode
                        ? { color: "white", opacity: 0.8 }
                        : undefined
                    }
                  >
                    {totalExpenses > 0
                      ? ((amount / totalExpenses) * 100).toFixed(1)
                      : 0}
                    % tổng chi tiêu
                  </div>
                  <div
                    className={`w-full shadow-2xl rounded-full h-1.5 ${
                      isFullColorMode ? "bg-white" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                        }%`,
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
          <Card className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-3">
            <CardContent className="p-6 sm:p-8 flex items-center justify-center min-h-32">
              <div className="text-center">
                <p className="text-muted-foreground text-sm sm:text-base">
                  Không có dữ liệu chi tiêu trong {getCurrentPeriodLabel()}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-2 opacity-75">
                  Hãy thêm giao dịch để xem thống kê
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
