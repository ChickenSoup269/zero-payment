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
  HomeIcon,
  BookOpenIcon,
  PiggyBankIcon,
  TrendingUpIcon,
  GiftIcon,
  CoinsIcon,
  ShoppingCartIcon,
} from "lucide-react"

interface ExpenseSummaryProps {
  expenses: Expense[]
  timeFrame: TimeFrame
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

export function ExpenseSummary({ expenses, timeFrame }: ExpenseSummaryProps) {
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

  const totalExpenses = calculateTotalExpenses(expenses)
  const previousTotalExpenses = calculateTotalExpenses(previousPeriodExpenses)

  // Calculate percentage change
  const percentageChange =
    previousTotalExpenses === 0
      ? 100
      : ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100

  // Group expenses by category
  const categoriesData = groupExpensesByCategory(expenses)

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
    <div className="space-y-6">
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

        {sortedCategories.map(([category, amount]) => {
          const categoryColor =
            CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#888"
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
        })}
      </div>
    </div>
  )
}
