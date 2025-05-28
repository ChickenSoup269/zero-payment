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

  // Generate available periods based on expenses and timeframe
  const getAvailablePeriods = (timeFrame: TimeFrame): TimePeriod[] => {
    if (timeFrame === "all") return []

    const periods: TimePeriod[] = []
    const now = new Date()

    // Find the oldest expense date
    const oldestExpense =
      expenses.length > 0
        ? expenses.reduce((oldest, expense) => {
            const expenseDate = new Date(expense.timestamp)
            return expenseDate < oldest ? expenseDate : oldest
          }, now)
        : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // 1 year ago as fallback

    if (timeFrame === "week") {
      // Generate weeks - ensure we have at least 8-10 weeks
      const currentWeekStart = new Date(now)
      const dayOfWeek = now.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      currentWeekStart.setDate(now.getDate() - daysFromMonday)
      currentWeekStart.setHours(0, 0, 0, 0)

      const weekStart = new Date(currentWeekStart)
      let weekNumber = 0

      // Generate at least 20 weeks to ensure we have enough history
      const minWeeks = 20
      const maxWeeksFromOldest =
        Math.ceil(
          (now.getTime() - oldestExpense.getTime()) / (7 * 24 * 60 * 60 * 1000)
        ) + 5

      const weeksToGenerate = Math.max(minWeeks, maxWeeksFromOldest)

      while (weekNumber < weeksToGenerate) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        const isCurrentWeek = weekNumber === 0

        // Format week label
        const startDay = weekStart.getDate()
        const startMonth = weekStart.getMonth() + 1
        const endDay = weekEnd.getDate()
        const endMonth = weekEnd.getMonth() + 1
        const endYear = weekEnd.getFullYear()

        let label: string
        if (isCurrentWeek) {
          label = "Tuần này"
        } else if (weekNumber === 1) {
          label = "Tuần trước"
        } else {
          const yearSuffix = endYear !== now.getFullYear() ? `/${endYear}` : ""
          label = `Tuần ${startDay}/${startMonth} - ${endDay}/${endMonth}${yearSuffix}`
        }

        periods.push({
          value: isCurrentWeek ? "current" : `week-${weekNumber}`,
          label,
          startDate: new Date(weekStart),
          endDate: new Date(weekEnd),
        })

        weekStart.setDate(weekStart.getDate() - 7)
        weekNumber++
      }
    } else if (timeFrame === "month") {
      // Generate months
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      let monthNumber = 0

      // Generate at least 12 months
      const minMonths = 12
      const monthsFromOldest =
        (now.getFullYear() - oldestExpense.getFullYear()) * 12 +
        (now.getMonth() - oldestExpense.getMonth()) +
        3

      const monthsToGenerate = Math.max(minMonths, monthsFromOldest)

      while (monthNumber < monthsToGenerate) {
        const monthEnd = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0
        )
        monthEnd.setHours(23, 59, 59, 999)

        const isCurrentMonth = monthNumber === 0
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

        let label: string
        if (isCurrentMonth) {
          label = "Tháng này"
        } else if (monthNumber === 1) {
          label = "Tháng trước"
        } else {
          const yearSuffix =
            currentMonth.getFullYear() !== now.getFullYear()
              ? ` ${currentMonth.getFullYear()}`
              : ""
          label = `${monthNames[currentMonth.getMonth()]}${yearSuffix}`
        }

        periods.push({
          value: isCurrentMonth ? "current" : `month-${monthNumber}`,
          label,
          startDate: new Date(currentMonth),
          endDate: new Date(monthEnd),
        })

        currentMonth.setMonth(currentMonth.getMonth() - 1)
        monthNumber++
      }
    } else if (timeFrame === "year") {
      // Generate years
      let currentYear = now.getFullYear()
      let yearNumber = 0
      const minYears = 5
      const yearsFromOldest =
        now.getFullYear() - oldestExpense.getFullYear() + 2

      const yearsToGenerate = Math.max(minYears, yearsFromOldest)

      while (yearNumber < yearsToGenerate) {
        const yearStart = new Date(currentYear, 0, 1)
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999)

        const isCurrentYear = yearNumber === 0
        let label: string
        if (isCurrentYear) {
          label = "Năm này"
        } else if (yearNumber === 1) {
          label = "Năm trước"
        } else {
          label = `Năm ${currentYear}`
        }

        periods.push({
          value: isCurrentYear ? "current" : `year-${yearNumber}`,
          label,
          startDate: yearStart,
          endDate: yearEnd,
        })

        currentYear--
        yearNumber++
      }
    }

    return periods
  }

  const availablePeriods = getAvailablePeriods(timeFrame)

  // Get current period range - FIX: Make sure this works correctly
  const getCurrentPeriodRange = () => {
    if (timeFrame === "all") return null

    if (selectedPeriod === "current") {
      const now = new Date()
      const startDate = new Date()

      switch (timeFrame) {
        case "week":
          const dayOfWeek = now.getDay()
          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
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
      }

      return { startDate, endDate: now }
    } else {
      // Find selected period from available periods
      const period = availablePeriods.find((p) => p.value === selectedPeriod)
      return period
        ? { startDate: period.startDate, endDate: period.endDate }
        : null
    }
  }

  // Get previous period range for comparison - FIX: Improve logic
  const getPreviousPeriodRange = () => {
    if (timeFrame === "all") return null

    // If we're looking at current period, get the immediate previous period
    if (selectedPeriod === "current") {
      const now = new Date()

      switch (timeFrame) {
        case "week": {
          const currentWeekStart = new Date(now)
          const dayOfWeek = now.getDay()
          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
          currentWeekStart.setDate(now.getDate() - daysFromMonday)

          const prevWeekStart = new Date(currentWeekStart)
          prevWeekStart.setDate(currentWeekStart.getDate() - 7)
          const prevWeekEnd = new Date(prevWeekStart)
          prevWeekEnd.setDate(prevWeekStart.getDate() + 6)
          prevWeekEnd.setHours(23, 59, 59, 999)
          return { startDate: prevWeekStart, endDate: prevWeekEnd }
        }
        case "month": {
          const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const prevMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() - 1,
            1
          )
          const lastDayPrevMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            0
          )
          lastDayPrevMonth.setHours(23, 59, 59, 999)
          return { startDate: prevMonth, endDate: lastDayPrevMonth }
        }
        case "year": {
          const currentYear = now.getFullYear()
          const prevYear = new Date(currentYear - 1, 0, 1)
          const lastDayPrevYear = new Date(currentYear - 1, 11, 31)
          lastDayPrevYear.setHours(23, 59, 59, 999)
          return { startDate: prevYear, endDate: lastDayPrevYear }
        }
      }
    } else {
      // If we're looking at a specific period, find the period right before it
      const currentPeriodIndex = availablePeriods.findIndex(
        (p) => p.value === selectedPeriod
      )
      if (
        currentPeriodIndex >= 0 &&
        currentPeriodIndex < availablePeriods.length - 1
      ) {
        const prevPeriod = availablePeriods[currentPeriodIndex + 1]
        return { startDate: prevPeriod.startDate, endDate: prevPeriod.endDate }
      }
    }

    return null
  }

  // Filter expenses based on selected period
  const filteredExpenses = React.useMemo(() => {
    const currentRange = getCurrentPeriodRange()
    if (!currentRange) return expenses

    const { startDate, endDate } = currentRange
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.timestamp)
      return expenseDate >= startDate && expenseDate <= endDate
    })
  }, [expenses, timeFrame, selectedPeriod])

  // Calculate previous period expenses
  const previousPeriodExpenses = React.useMemo(() => {
    const prevRange = getPreviousPeriodRange()
    if (!prevRange) return []

    const { startDate, endDate } = prevRange
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.timestamp)
      return expenseDate >= startDate && expenseDate <= endDate
    })
  }, [expenses, timeFrame, selectedPeriod])

  const totalExpenses = calculateTotalExpenses(filteredExpenses)
  const previousTotalExpenses = calculateTotalExpenses(previousPeriodExpenses)

  // Calculate percentage change - FIX: Better handling
  const percentageChange = React.useMemo(() => {
    if (timeFrame === "all") return 0
    if (previousTotalExpenses === 0) {
      return totalExpenses > 0 ? 100 : 0
    }
    const change =
      ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100
    if (!isFinite(change)) return 0
    console.log(change) // Log đúng, ví dụ: -75.95
    return change
  }, [totalExpenses, previousTotalExpenses, timeFrame])

  // Group expenses by category
  const categoriesData = groupExpensesByCategory(filteredExpenses)

  // Sort categories by amount (descending)
  const sortedCategories = Object.entries(categoriesData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)

  // Get current period label
  const getCurrentPeriodLabel = () => {
    if (timeFrame === "all") return "tất cả thời gian"

    const period = availablePeriods.find((p) => p.value === selectedPeriod)
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

  // Reset selected period when timeframe changes
  React.useEffect(() => {
    setSelectedPeriod("current")
  }, [timeFrame])

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
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Tabs
                value={timeFrame}
                onValueChange={handleTimeFrameChange}
                className="w-full"
              >
                <TabsList className="custom-tabs-list">
                  <TabsTrigger className="custom-tab-trigger" value="week">
                    Tuần
                  </TabsTrigger>
                  <TabsTrigger className="custom-tab-trigger" value="month">
                    Tháng
                  </TabsTrigger>
                  <TabsTrigger className="custom-tab-trigger" value="year">
                    Năm
                  </TabsTrigger>
                  <TabsTrigger className="custom-tab-trigger" value="all">
                    Tất cả
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {timeFrame !== "all" && availablePeriods.length > 0 && (
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Chọn khoảng thời gian" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeriods.map((period) => (
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`overflow-hidden border-l-4 border-b-4 border-[var(--primary-color)] ${
            isFullColorMode
              ? "text-[var(--primary-color)] "
              : "bg-white bg-opacity-20"
          }`}
        >
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              Tổng chi tiêu {getCurrentPeriodLabel()}
            </div>
            <div className="text-2xl font-bold ">
              {formatCurrency(totalExpenses)}
            </div>
            {timeFrame !== "all" && (
              <div className="flex items-center mt-2 text-sm">
                {(() => {
                  if (Math.abs(percentageChange) < 0.01) {
                    return <span className="text-gray-500">0.0%</span>
                  } else if (percentageChange > 0) {
                    return (
                      <>
                        <ArrowUpIcon className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-red-500">
                          +{percentageChange.toFixed()}%
                        </span>
                      </>
                    )
                  } else {
                    return (
                      <>
                        <ArrowDownIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500">
                          {percentageChange.toFixed(1)}%
                        </span>
                      </>
                    )
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
                    {totalExpenses > 0
                      ? ((amount / totalExpenses) * 100).toFixed(1)
                      : 0}
                    % tổng chi tiêu
                  </div>
                  <div
                    className={`w-full shadow-2xl rounded-full h-1.5 mt-2 ${
                      isFullColorMode ? "bg-white" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className="h-1.5 rounded-full"
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
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 flex items-center justify-center h-32">
              <p className="text-muted-foreground text-center">
                Không có dữ liệu chi tiêu trong {getCurrentPeriodLabel()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
