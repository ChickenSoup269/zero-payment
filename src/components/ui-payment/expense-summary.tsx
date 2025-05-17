"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Expense, TimeFrame } from "@/lib/types"
import {
  calculateTotalExpenses,
  formatCurrency,
  groupExpensesByCategory,
  //  filterExpensesByTimeFrame,
} from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface ExpenseSummaryProps {
  expenses: Expense[]
  timeFrame: TimeFrame
}

export function ExpenseSummary({ expenses, timeFrame }: ExpenseSummaryProps) {
  const [previousPeriodExpenses, setPreviousPeriodExpenses] = React.useState<
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

    setPreviousPeriodExpenses(previousPeriod)
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
    .slice(0, 3) // Take top 3

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
        <Card>
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

        {sortedCategories.map(([category, amount]) => (
          <Card key={category}>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[
                        category as keyof typeof CATEGORY_COLORS
                      ] || "#888",
                  }}
                />
                <div className="text-sm text-muted-foreground">{category}</div>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(amount)}</div>
              <div className="text-sm text-muted-foreground mt-2">
                {((amount / totalExpenses) * 100).toFixed(1)}% tổng chi tiêu
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
