"use client"

import * as React from "react"
import {
  BarChart,
  PieChart,
  LineChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Bar,
  Line,
  Area,
  ReferenceLine,
} from "recharts"
import { Expense, ChartType, TimeFrame } from "@/lib/types"
import {
  formatCurrency,
  groupExpensesByCategory,
  groupExpensesByDate,
  groupExpensesBySubcategory,
} from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
  ChartBarIcon,
  PieChartIcon,
  BarChartIcon,
  TrendingUpIcon,
} from "lucide-react"
import { Pie } from "recharts"
// Mở rộng ChartType để hỗ trợ các loại biểu đồ mới
type ExtendedChartType =
  | "pie"
  | "bar"
  | "line"
  | "multiple-bar"
  | "gradient-area"
  | "interactive-area"
  | "shadcn-pie"

interface ExpenseChartProps {
  expenses: Expense[]
  chartType?: ExtendedChartType
  timeFrame: TimeFrame
  currency?: "VND" | "USD"
  title?: string
  description?: string
}

// Hàm tạo màu gradient tự động
// const generateGradientColors = (baseColor: string, count: number) => {
//   // Tạo array màu với độ đậm nhạt khác nhau từ baseColor
//   const colors = []
//   for (let i = 0; i < count; i++) {
//     const opacity = 0.3 + (i * 0.7) / count
//     colors.push(
//       `${baseColor}${Math.floor(opacity * 255)
//         .toString(16)
//         .padStart(2, "0")}`
//     )
//   }
//   return colors
// }

export function ExpenseChart({
  expenses,
  chartType = "multiple-bar",
  timeFrame,
  currency = "VND",
  title = "Phân tích chi tiêu",
  description = "Trực quan hóa dữ liệu chi tiêu của bạn",
}: ExpenseChartProps) {
  const [selectedChart, setSelectedChart] =
    React.useState<ExtendedChartType>(chartType)
  const [chartData, setChartData] = React.useState<any[]>([])
  const [activeIndex, setActiveIndex] = React.useState<number>(0)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Xử lý dữ liệu cho biểu đồ
  React.useEffect(() => {
    if (expenses.length === 0) {
      setChartData([])
      return
    }

    switch (selectedChart) {
      case "pie":
      case "shadcn-pie":
        const groupedData = groupExpensesByCategory(expenses)
        const chartData = Object.entries(groupedData).map(([name, value]) => ({
          name,
          value,
        }))
        setChartData(chartData)
        break

      case "multiple-bar":
        // Nhóm dữ liệu theo danh mục cho biểu đồ cột nhiều cột
        const categoryData = groupExpensesByCategory(expenses)
        const subcategoryData = groupExpensesBySubcategory(expenses)

        // Tạo dữ liệu theo từng khoảng thời gian
        const timeData = groupExpensesByDate(expenses, timeFrame)

        // Kết hợp dữ liệu theo thời gian và danh mục
        const multipleBarData = Object.entries(timeData)
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

            // Lấy top 3 danh mục chi tiêu chính
            const topCategories = Object.entries(categoryData)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([category]) => category)

            // Tạo object kết quả
            const result: any = { name: date }

            // Thêm dữ liệu cho top 3 danh mục
            topCategories.forEach((category) => {
              result[category] = categoriesOnDate[category] || 0
            })

            // Thêm tổng chi tiêu
            result.total = expensesOnDate.reduce(
              (sum, expense) => sum + expense.amount,
              0
            )

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

        setChartData(multipleBarData)
        break

      case "gradient-area":
      case "interactive-area":
        const timeSeriesData = groupExpensesByDate(expenses, timeFrame)
        const areaChartData = Object.entries(timeSeriesData).map(
          ([name, value]) => ({
            name,
            amount: value,
            average:
              Object.values(timeSeriesData).reduce((a, b) => a + b, 0) /
              Object.values(timeSeriesData).length,
          })
        )

        setChartData(
          areaChartData.sort((a, b) => {
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
        )
        break

      default:
        // Line và bar chart thông thường
        const groupedByDate = groupExpensesByDate(expenses, timeFrame)
        const lineBarData = Object.entries(groupedByDate).map(
          ([name, value]) => ({
            name,
            amount: value,
          })
        )

        setChartData(
          lineBarData.sort((a, b) => {
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
        )
    }
  }, [expenses, selectedChart, timeFrame])

  // Xử lý sự kiện cho Interactive Area Chart
  const handleMouseOver = (data: any, index: number) => {
    if (selectedChart === "interactive-area") {
      setActiveIndex(index)
    }
  }

  // Danh sách các loại biểu đồ
  const chartTypes = [
    {
      value: "multiple-bar",
      label: "Biểu đồ cột",
      icon: <BarChartIcon className="w-4 h-4" />,
    },
    {
      value: "gradient-area",
      label: "Biểu đồ vùng",
      icon: <TrendingUpIcon className="w-4 h-4" />,
    },
    {
      value: "interactive-area",
      label: "Biểu đồ tương tác",
      icon: <ChartBarIcon className="w-4 h-4" />,
    },
    {
      value: "shadcn-pie",
      label: "Biểu đồ tròn",
      icon: <PieChartIcon className="w-4 h-4" />,
    },
  ]

  // Lọc top 3 danh mục chi tiêu lớn nhất cho Multiple Bar Chart
  const topCategories = React.useMemo(() => {
    if (selectedChart !== "multiple-bar" || chartData.length === 0) return []

    const allCategories = Object.keys(chartData[0]).filter(
      (key) => key !== "name" && key !== "total"
    )

    return allCategories
  }, [chartData, selectedChart])

  // Render biểu đồ dựa trên loại được chọn
  const renderChart = () => {
    if (expenses.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Không có dữ liệu để hiển thị</p>
        </div>
      )
    }

    switch (selectedChart) {
      case "shadcn-pie":
        // Sử dụng UI của shadcn cho biểu đồ pie
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Chi tiêu theo danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      innerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {chartData.map(
                        (
                          entry: { name: string; value: number },
                          index: number
                        ) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              CATEGORY_COLORS[
                                entry.name as keyof typeof CATEGORY_COLORS
                              ] ||
                              `#${Math.floor(Math.random() * 16777215).toString(
                                16
                              )}`
                            }
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value, currency),
                        "Số tiền",
                      ]}
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        color: isDark ? "#f9fafb" : "#111827",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {chartData.slice(0, 6).map((category) => (
                  <Card key={category.name} className="overflow-hidden">
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                CATEGORY_COLORS[
                                  category.name as keyof typeof CATEGORY_COLORS
                                ] ||
                                `#${Math.floor(
                                  Math.random() * 16777215
                                ).toString(16)}`,
                            }}
                          />
                          <span className="text-xs font-medium truncate max-w-[100px]">
                            {category.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium">
                          {formatCurrency(category.value, currency)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )

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
                  formatCurrency(value, currency),
                  "Số tiền",
                ]}
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case "multiple-bar":
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
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              />
              <Legend />
              {topCategories.map((category, index) => (
                <Bar
                  key={`bar-${category}`}
                  dataKey={category}
                  fill={
                    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
                    `#${Math.floor(Math.random() * 16777215).toString(16)}`
                  }
                  stackId="a"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "gradient-area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value, currency),
                  "Số tiền",
                ]}
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              />
              <Legend />
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
              <ReferenceLine
                y={
                  chartData.reduce((sum, item) => sum + item.average, 0) /
                  chartData.length
                }
                label="Trung bình"
                stroke="#ff7300"
                strokeDasharray="3 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case "interactive-area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={chartData}
              onMouseMove={(data: any) => {
                if (data && data.activeTooltipIndex !== undefined) {
                  handleMouseOver(data, data.activeTooltipIndex)
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value, currency),
                  "Số tiền",
                ]}
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              />
              <Legend />
              <defs>
                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#82ca9d"
                fillOpacity={1}
                fill="url(#splitColor)"
                activeDot={{
                  r:
                    activeIndex !== undefined
                      ? chartData[activeIndex]?.name ===
                        chartData[activeIndex]?.name
                        ? 8
                        : 4
                      : 4,
                }}
              />
              <ReferenceLine
                y={
                  chartData.reduce((sum, item) => sum + item.amount, 0) /
                  chartData.length
                }
                label="Trung bình"
                strokeDasharray="3 3"
                stroke="#ff7300"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

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
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
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
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Tabs
            value={selectedChart}
            onValueChange={(value) =>
              setSelectedChart(value as ExtendedChartType)
            }
          >
            <TabsList>
              {chartTypes.map((type) => (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="flex items-center gap-1"
                >
                  {type.icon}
                  <span className="hidden sm:inline">{type.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  )
}
