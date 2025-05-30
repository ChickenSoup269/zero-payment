"use client"

import * as React from "react"
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Expense, TimeFrame } from "@/lib/types"
import {
  formatCurrency,
  groupExpensesByCategory,
  groupExpensesByDate,
} from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"

interface ExpenseChartProps {
  expenses: Expense[]
  timeFrame: TimeFrame
  currency?: "VND" | "USD"
  title?: string
  description?: string
}

export function ExpenseChart({
  expenses,
  timeFrame,
  currency = "VND",
  title = "Phân tích chi tiêu",
  description = "Trực quan hóa dữ liệu chi tiêu của bạn",
}: ExpenseChartProps) {
  const [chartData, setChartData] = React.useState<any[]>([])
  const [pieData, setPieData] = React.useState<any[]>([])
  const [radarData, setRadarData] = React.useState<any[]>([])
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Xử lý dữ liệu cho biểu đồ
  React.useEffect(() => {
    if (expenses.length === 0) {
      setChartData([])
      setPieData([])
      setRadarData([])
      return
    }

    // Dữ liệu cho Pie Chart
    const categoryData = groupExpensesByCategory(expenses)
    const pieChartData = Object.entries(categoryData).map(
      ([name, value], index) => ({
        name,
        value,
        percentage: (
          (value / Object.values(categoryData).reduce((a, b) => a + b, 0)) *
          100
        ).toFixed(1),
        fill:
          CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] ||
          `hsl(${(index * 45) % 360}, 70%, 50%)`,
      })
    )
    setPieData(pieChartData)

    // Lấy top 3 danh mục chi tiêu nhiều nhất
    const topCategories = Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)

    // Tạo dữ liệu theo thời gian cho Bar Chart
    const timeData = groupExpensesByDate(expenses, timeFrame)

    const processedData = Object.entries(timeData)
      .map(([date]) => {
        // Lọc chi tiêu theo ngày
        const expensesOnDate = expenses.filter((expense) => {
          if (timeFrame === "year") {
            const [_, month, year] = expense.date.split("-")
            return `${month}-${year}` === date
          }
          return expense.date === date
        })

        // Nhóm chi tiêu theo danh mục
        const categoriesOnDate = groupExpensesByCategory(expensesOnDate)

        // Tạo object kết quả
        const result: any = {
          name: date,
          total: expensesOnDate.reduce(
            (sum, expense) => sum + expense.amount,
            0
          ),
        }

        // Thêm dữ liệu cho top 3 danh mục
        topCategories.forEach((category) => {
          result[category] = categoriesOnDate[category] || 0
        })

        return result
      })
      .sort((a, b) => {
        if (timeFrame === "year") {
          const [monthA, yearA] = a.name.split("-").map(Number)
          const [monthB, yearB] = b.name.split("-").map(Number)
          if (yearA !== yearB) return yearA - yearB
          return monthA - monthB
        } else {
          const [dayA, monthA, yearA] = a.name.split("-").map(Number)
          const [dayB, monthB, yearB] = b.name.split("-").map(Number)
          if (yearA !== yearB) return yearA - yearB
          if (monthA !== monthB) return monthA - monthB
          return dayA - dayB
        }
      })

    setChartData(processedData)

    // Dữ liệu cho Radar Chart
    const radarChartData = processedData.slice(0, 6).map((item) => ({
      name: item.name,
      ...topCategories.reduce((acc, category) => {
        acc[category] =
          (item[category] /
            Math.max(...processedData.map((d) => d[category] || 0))) *
          100
        return acc
      }, {} as any),
    }))

    setRadarData(radarChartData)
  }, [expenses, timeFrame])

  // Lấy top 3 danh mục
  const topCategories = React.useMemo(() => {
    if (chartData.length === 0) return []
    return Object.keys(chartData[0]).filter(
      (key) => key !== "name" && key !== "total"
    )
  }, [chartData])

  const commonTooltipProps = {
    formatter: (value: number) => [formatCurrency(value, currency), "Số tiền"],
    contentStyle: {
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: isDark ? "#374151" : "#e5e7eb",
      color: isDark ? "#f9fafb" : "#111827",
      borderRadius: "8px",
    },
  }

  if (expenses.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">
              Không có dữ liệu để hiển thị
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
      </Card>

      {/* Bar Chart - Full Width */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">
            Biểu đồ cột hỗn hợp
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Chi tiêu theo thời gian và danh mục
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip {...commonTooltipProps} />
              <Legend />

              <Bar
                dataKey="total"
                fill="#8884d8"
                fillOpacity={0.6}
                name="Tổng chi tiêu"
                radius={[4, 4, 0, 0]}
              />

              {topCategories.map((category) => (
                <Bar
                  key={`mixed-${category}`}
                  dataKey={category}
                  stackId="categories"
                  fill={
                    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
                    `hsl(${Math.random() * 360}, 70%, 50%)`
                  }
                  name={category}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart và Radar Chart - Cùng hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Donut Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">
              Biểu đồ tròn donut
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Phân bổ chi tiêu theo danh mục
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value, currency),
                      "Số tiền",
                    ]}
                    contentStyle={commonTooltipProps.contentStyle}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-lg font-bold">
                  {formatCurrency(totalAmount, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Tổng chi tiêu
                </div>
              </div>
            </div>

            {/* Legend - Compact */}
            <div className="mt-4 grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
              {pieData.slice(0, 4).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Biểu đồ radar</CardTitle>
            <p className="text-sm text-muted-foreground">
              So sánh xu hướng chi tiêu theo danh mục
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />

                {topCategories.map((category, index) => (
                  <Radar
                    key={category}
                    name={category}
                    dataKey={category}
                    stroke={
                      CATEGORY_COLORS[
                        category as keyof typeof CATEGORY_COLORS
                      ] || `hsl(${(index * 120) % 360}, 70%, 50%)`
                    }
                    fill={
                      CATEGORY_COLORS[
                        category as keyof typeof CATEGORY_COLORS
                      ] || `hsl(${(index * 120) % 360}, 70%, 50%)`
                    }
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                ))}

                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(1)}%`,
                    "Tỷ lệ",
                  ]}
                  contentStyle={commonTooltipProps.contentStyle}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Thống kê tóm tắt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">
              Tổng chi tiêu
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(
                expenses.reduce((sum, expense) => sum + expense.amount, 0),
                currency
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">
              Trung bình/ngày
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(
                chartData.length > 0
                  ? chartData.reduce((sum, item) => sum + item.total, 0) /
                      chartData.length
                  : 0,
                currency
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">
              Danh mục chính
            </div>
            <div className="text-lg font-bold truncate">
              {topCategories[0] || "Không có"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
