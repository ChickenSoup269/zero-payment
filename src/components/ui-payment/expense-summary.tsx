"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Expense, TimeFrame } from "@/lib/types"
import {
  calculateTotalExpenses,
  formatCurrency,
  groupExpensesByCategory,
} from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants"
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
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ExpenseSummaryProps {
  expenses: Expense[]
  defaultTimeFrame?: TimeFrame
}

// Map của danh mục chính đến icon tương ứng
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Chi tiêu thiết yếu": <ShoppingCartIcon className="w-5 h-5 text-white" />,
  "Mua sắm giải trí": <ShoppingBagIcon className="w-5 h-5 text-white" />,
  "Giáo dục và y tế": <BookOpenIcon className="w-5 h-5 text-white" />,
  "Tiết kiệm": <PiggyBankIcon className="w-5 h-5 text-white" />,
  "Đầu tư": <TrendingUpIcon className="w-5 h-5 text-white" />,
  "Chi khác": <GiftIcon className="w-5 h-5 text-white" />,
  "Tiền vay": <CoinsIcon className="w-5 h-5 text-white" />,
}

export function ExpenseSummary({
  expenses,
  defaultTimeFrame = "month",
}: ExpenseSummaryProps) {
  const [timeFrame, setTimeFrame] = React.useState<TimeFrame>(defaultTimeFrame)
  const [previousPeriodExpenses, setPreviousPreviodExpenses] = React.useState<
    Expense[]
  >([])

  React.useEffect(() => {
    // Calculate previous period expenses based on current timeFrame
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

    // Filter expenses for previous period
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

    setPreviousPreviodExpenses(previousPeriod)
  }, [expenses, timeFrame])

  // Filter expenses based on selected timeFrame
  const filteredExpenses = React.useMemo(() => {
    const now = new Date()
    const startDate = new Date()

    switch (timeFrame) {
      case "week":
        // Bắt đầu từ thứ 2 của tuần này
        const dayOfWeek = now.getDay()
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        startDate.setDate(diff)
        startDate.setHours(0, 0, 0, 0)
        break
      case "month":
        // Bắt đầu từ ngày 1 của tháng hiện tại
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        break
      case "year":
        // Bắt đầu từ ngày 1 tháng 1 của năm hiện tại
        startDate.setMonth(0, 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case "all":
      default:
        // Tất cả thời gian
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
    .slice(0, 9) // lấy top 9 danh mục

  // Time frame label
  const timeFrameLabel = {
    week: "tuần này",
    month: "tháng này",
    year: "năm này",
    all: "tất cả thời gian",
  }[timeFrame]

  return (
    <div className="space-y-6 ">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-2xl font-bold mb-2 sm:mb-0">Tổng quan chi tiêu</h2>
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <Tabs
            value={timeFrame}
            onValueChange={(value) => setTimeFrame(value as TimeFrame)}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="week">Tuần này</TabsTrigger>
              <TabsTrigger value="month">Tháng này</TabsTrigger>
              <TabsTrigger value="year">Năm này</TabsTrigger>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
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
            return (
              <Card
                key={category}
                className="overflow-hidden border-l-4"
                style={{ borderLeftColor: categoryColor }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-full mr-2 flex items-center justify-center"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {CATEGORY_ICONS[category] || (
                          <ShoppingBagIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="text-sm font-medium">{category}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {formatCurrency(amount)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {((amount / totalExpenses) * 100).toFixed(1)}% tổng chi tiêu
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(amount / totalExpenses) * 100}%`,
                        backgroundColor: categoryColor,
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
