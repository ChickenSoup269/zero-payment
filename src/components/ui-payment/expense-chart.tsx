/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { Bar, Pie, Line } from "recharts"
import {
  BarChart,
  PieChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Expense, ChartType, TimeFrame } from "@/lib/types"
import {
  formatCurrency,
  groupExpensesByCategory,
  groupExpensesByDate,
} from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants"

interface ExpenseChartProps {
  expenses: Expense[]
  chartType: ChartType
  timeFrame: TimeFrame
  currency: "VND" | "USD"
}

export function ExpenseChart({
  expenses,
  chartType,
  timeFrame,
  currency,
}: ExpenseChartProps) {
  const [chartData, setChartData] = React.useState<any[]>([])

  React.useEffect(() => {
    if (expenses.length === 0) {
      setChartData([])
      return
    }

    if (chartType === "pie") {
      const groupedData = groupExpensesByCategory(expenses)
      const chartData = Object.entries(groupedData).map(([name, value]) => ({
        name,
        value,
      }))
      setChartData(chartData)
    } else {
      const groupedData = groupExpensesByDate(expenses, timeFrame)
      const chartData = Object.entries(groupedData).map(([name, value]) => ({
        name,
        amount: value,
      }))
      setChartData(
        chartData.sort((a, b) => {
          const [dayA, monthA, yearA] = a.name.split("-").map(Number)
          const [dayB, monthB, yearB] = b.name.split("-").map(Number)
          if (yearA !== yearB) return yearA - yearB
          if (monthA !== monthB) return monthA - monthB
          return dayA - dayB
        })
      )
    }
  }, [expenses, chartType, timeFrame])

  const renderChart = () => {
    if (expenses.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Không có dữ liệu để hiển thị</p>
        </div>
      )
    }

    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map(
                  (entry: { name: string; value: number }, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        CATEGORY_COLORS[
                          entry.name as keyof typeof CATEGORY_COLORS
                        ] ||
                        `#${Math.floor(Math.random() * 16777215).toString(16)}`
                      }
                    />
                  )
                )}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value),
                  "Số tiền",
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      // biểu đồ cột
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value, currency),
                  "Số tiền",
                ]}
              />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value, currency),
                  "Số tiền",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return <div className="w-full h-full">{renderChart()}</div>
}
