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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import {
  BarChart3Icon,
  BarChart4Icon,
  ActivityIcon,
  TrendingUpIcon,
  PieChartIcon,
  CircleDotIcon,
  RadarIcon,
  MousePointerIcon,
  CalendarIcon,
  ChevronDownIcon,
} from "lucide-react"

// Mở rộng ChartType với 9 loại biểu đồ (thêm weekly/monthly/yearly-comparison)
type ChartType =
  | "mixed"
  | "multiple"
  | "interactive"
  | "line-dots"
  | "pie-donut"
  | "radial-text"
  | "radar-multiple"
  | "tooltip-no-indicator"
  | "time-comparison"

// Thêm ComparisonType để phân biệt các loại so sánh
type ComparisonType = "weekly" | "monthly" | "yearly"

interface ExpenseChartProps {
  expenses: Expense[]
  chartType?: ChartType
  timeFrame: TimeFrame
  currency?: "VND" | "USD"
  title?: string
  description?: string
}

export function ExpenseChart({
  expenses,
  chartType = "mixed",
  timeFrame,
  currency = "VND",
  title = "Phân tích chi tiêu",
  description = "Trực quan hóa dữ liệu chi tiêu của bạn",
}: ExpenseChartProps) {
  const [selectedChart, setSelectedChart] = React.useState<ChartType>(chartType)
  const [comparisonType, setComparisonType] = React.useState<ComparisonType>("weekly")
  const [chartData, setChartData] = React.useState<any[]>([])
  const [pieData, setPieData] = React.useState<any[]>([])
  const [comparisonData, setComparisonData] = React.useState<any[]>([])
  const [activeBar, setActiveBar] = React.useState<string | null>(null)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Hàm tính tuần trong năm và format hiển thị
  const getWeekInfo = (dateString: string) => {
    const [day, month, year] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)

    // Tính tuần trong năm
    const firstDayOfYear = new Date(year, 0, 1)
    const daysSinceFirst = Math.floor(
      (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000)
    )
    const weekNumber = Math.ceil(
      (daysSinceFirst + firstDayOfYear.getDay() + 1) / 7
    )

    // Tính ngày đầu và cuối tuần
    const dayOfWeek = date.getDay()
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    return {
      weekKey: `${year}-W${weekNumber.toString().padStart(2, "0")}`,
      weekLabel: `Tuần ${weekNumber}/${year}`,
      weekRange: `${startOfWeek.getDate().toString().padStart(2, "0")}/${(
        startOfWeek.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")} - ${endOfWeek
        .getDate()
        .toString()
        .padStart(2, "0")}/${(endOfWeek.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`,
      weekNumber,
      year,
      startDate: startOfWeek,
      endDate: endOfWeek,
    }
  }

  // Hàm tính thông tin tháng
  const getMonthInfo = (dateString: string) => {
    const [day, month, year] = dateString.split("-").map(Number)
    const monthNames = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ]

    return {
      monthKey: `${year}-${month.toString().padStart(2, "0")}`,
      monthLabel: `${monthNames[month - 1]}/${year}`,
      monthRange: `${month.toString().padStart(2, "0")}/${year}`,
      month,
      year,
    }
  }

  // Hàm tính thông tin năm
  const getYearInfo = (dateString: string) => {
    const [day, month, year] = dateString.split("-").map(Number)

    return {
      yearKey: year.toString(),
      yearLabel: `Năm ${year}`,
      yearRange: year.toString(),
      year,
    }
  }

  // Xử lý dữ liệu so sánh theo loại
  const processComparisonData = (type: ComparisonType) => {
    if (expenses.length === 0) return []

    let groupedData: any = {}

    expenses.forEach((expense) => {
      let info: any
      let key: string
      let label: string
      let range: string

      switch (type) {
        case "weekly":
          info = getWeekInfo(expense.date)
          key = info.weekKey
          label = info.weekLabel
          range = info.weekRange
          break
        case "monthly":
          info = getMonthInfo(expense.date)
          key = info.monthKey
          label = info.monthLabel
          range = info.monthRange
          break
        case "yearly":
          info = getYearInfo(expense.date)
          key = info.yearKey
          label = info.yearLabel
          range = info.yearRange
          break
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          key,
          label,
          range,
          expenses: [],
          total: 0,
          categories: {},
          ...info,
        }
      }

      groupedData[key].expenses.push(expense)
      groupedData[key].total += expense.amount

      // Nhóm theo danh mục
      const category = expense.category
      if (!groupedData[key].categories[category]) {
        groupedData[key].categories[category] = 0
      }
      groupedData[key].categories[category] += expense.amount
    })

    // Chuyển đổi thành mảng và sắp xếp
    const sortedData = Object.values(groupedData).sort((a: any, b: any) => {
      if (type === "weekly") {
        if (a.year !== b.year) return a.year - b.year
        return a.weekNumber - b.weekNumber
      } else if (type === "monthly") {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      } else {
        return a.year - b.year
      }
    })

    // Lấy số lượng phù hợp
    const limitMap = { weekly: 12, monthly: 12, yearly: 5 }
    return sortedData.slice(-limitMap[type])
  }

  // Xử lý dữ liệu cho biểu đồ
  React.useEffect(() => {
    if (expenses.length === 0) {
      setChartData([])
      setPieData([])
      setComparisonData([])
      return
    }

    // Dữ liệu cho Pie/Donut Charts
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

    // Xử lý dữ liệu so sánh
    const compData = processComparisonData(comparisonType)
    setComparisonData(compData)

    // Lấy top 3 danh mục chi tiêu nhiều nhất
    const topCategories = Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)

    // Tạo dữ liệu theo thời gian
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
  }, [expenses, timeFrame, comparisonType])

  // Danh sách 9 loại biểu đồ
  const chartTypes = [
    {
      value: "mixed" as ChartType,
      label: "Mixed Bar",
      icon: <BarChart3Icon className="w-4 h-4" />,
    },
    {
      value: "multiple" as ChartType,
      label: "Multiple Bar",
      icon: <BarChart4Icon className="w-4 h-4" />,
    },
    {
      value: "interactive" as ChartType,
      label: "Interactive Bar",
      icon: <ActivityIcon className="w-4 h-4" />,
    },
    {
      value: "line-dots" as ChartType,
      label: "Line Dots",
      icon: <TrendingUpIcon className="w-4 h-4" />,
    },
    {
      value: "pie-donut" as ChartType,
      label: "Pie Donut",
      icon: <PieChartIcon className="w-4 h-4" />,
    },
    {
      value: "radial-text" as ChartType,
      label: "Radial Text",
      icon: <CircleDotIcon className="w-4 h-4" />,
    },
    {
      value: "radar-multiple" as ChartType,
      label: "Radar Multiple",
      icon: <RadarIcon className="w-4 h-4" />,
    },
    {
      value: "tooltip-no-indicator" as ChartType,
      label: "No Indicator",
      icon: <MousePointerIcon className="w-4 h-4" />,
    },
    {
      value: "time-comparison" as ChartType,
      label: "Time Compare",
      icon: <CalendarIcon className="w-4 h-4" />,
    },
  ]

  // Lấy top 3 danh mục
  const topCategories = React.useMemo(() => {
    if (chartData.length === 0) return []
    return Object.keys(chartData[0]).filter(
      (key) => key !== "name" && key !== "total"
    )
  }, [chartData])

  // Custom Tooltip không có indicator
  const CustomTooltipNoIndicator = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span className="font-medium">{entry.name}:</span>{" "}
              <span className="text-primary">
                {formatCurrency(entry.value, currency)}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom Tooltip cho Time Comparison
  const TimeComparisonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      return (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg min-w-48">
          <p className="font-semibold text-sm mb-2">{data?.label}</p>
          <p className="text-xs text-muted-foreground mb-2">
            {data?.range}
          </p>
          <p className="text-sm">
            <span className="font-medium">Tổng chi tiêu:</span>{" "}
            <span className="text-primary font-semibold">
              {formatCurrency(data?.total || 0, currency)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data?.expenses?.length || 0} giao dịch
          </p>
        </div>
      )
    }
    return null
  }

  // Dropdown options cho comparison type
  const comparisonOptions = [
    { value: "weekly" as ComparisonType, label: "So sánh theo tuần", icon: "📅" },
    { value: "monthly" as ComparisonType, label: "So sánh theo tháng", icon: "📊" },
    { value: "yearly" as ComparisonType, label: "So sánh theo năm", icon: "📈" },
  ]

  // Render biểu đồ
  const renderChart = () => {
    if (expenses.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Không có dữ liệu để hiển thị</p>
        </div>
      )
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    }

    const commonTooltipProps = {
      formatter: (value: number) => [
        formatCurrency(value, currency),
        "Số tiền",
      ],
      contentStyle: {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        borderColor: isDark ? "#374151" : "#e5e7eb",
        color: isDark ? "#f9fafb" : "#111827",
        borderRadius: "8px",
      },
    }

    switch (selectedChart) {
      case "time-comparison":
        // So sánh chi tiêu theo thời gian
        if (comparisonData.length === 0) {
          return (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Không có dữ liệu để so sánh</p>
            </div>
          )
        }

        const maxSpending = Math.max(...comparisonData.map((item) => item.total))
        const minSpending = Math.min(...comparisonData.map((item) => item.total))
        const avgSpending =
          comparisonData.reduce((sum, item) => sum + item.total, 0) / comparisonData.length

        const getComparisonLabel = () => {
          switch (comparisonType) {
            case "weekly": return "tuần"
            case "monthly": return "tháng"
            case "yearly": return "năm"
          }
        }

        return (
          <div className="space-y-6">
            {/* Biểu đồ so sánh */}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<TimeComparisonTooltip />} />
                <Bar
                  dataKey="total"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                  name={`Chi tiêu ${getComparisonLabel()}`}
                >
                  {comparisonData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.total === maxSpending
                          ? "#ef4444" // Đỏ cho cao nhất
                          : entry.total === minSpending
                          ? "#10b981" // Xanh cho thấp nhất
                          : "#8884d8" // Màu mặc định
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Thống kê so sánh */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="text-sm font-medium text-red-700 dark:text-red-300">
                      {getComparisonLabel().charAt(0).toUpperCase() + getComparisonLabel().slice(1)} chi nhiều nhất
                    </div>
                  </div>
                  <div className="text-xl font-bold text-red-900 dark:text-red-100 mt-1">
                    {formatCurrency(maxSpending, currency)}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {
                      comparisonData.find((item) => item.total === maxSpending)
                        ?.label
                    }
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Trung bình/{getComparisonLabel()}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {formatCurrency(avgSpending, currency)}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Trong {comparisonData.length} {getComparisonLabel()} gần nhất
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">
                      {getComparisonLabel().charAt(0).toUpperCase() + getComparisonLabel().slice(1)} chi ít nhất
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {formatCurrency(minSpending, currency)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {
                      comparisonData.find((item) => item.total === minSpending)
                        ?.label
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bảng chi tiết */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Chi tiết chi tiêu theo {getComparisonLabel()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">{getComparisonLabel().charAt(0).toUpperCase() + getComparisonLabel().slice(1)}</th>
                        <th className="text-left p-2">Khoảng thời gian</th>
                        <th className="text-right p-2">Tổng chi tiêu</th>
                        <th className="text-right p-2">Số giao dịch</th>
                        <th className="text-right p-2">So với TB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData
                        .slice()
                        .reverse()
                        .map((item, index) => {
                          const diffFromAvg = item.total - avgSpending
                          const diffPercent = (
                            (diffFromAvg / avgSpending) *
                            100
                          ).toFixed(1)

                          return (
                            <tr
                              key={item.key}
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="p-2 font-medium">
                                {item.label}
                              </td>
                              <td className="p-2 text-muted-foreground">
                                {item.range}
                              </td>
                              <td className="p-2 text-right font-semibold">
                                {formatCurrency(item.total, currency)}
                              </td>
                              <td className="p-2 text-right">
                                {item.expenses.length}
                              </td>
                              <td className="p-2 text-right">
                                <span
                                  className={`font-medium ${
                                    diffFromAvg > 0
                                      ? "text-red-600"
                                      : diffFromAvg < 0
                                      ? "text-green-600"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {diffFromAvg > 0 ? "+" : ""}
                                  {diffPercent}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "mixed":
        // Bar Chart Mixed
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
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
        )

      case "line-dots":
        // Line Chart với Dots Colors
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip {...commonTooltipProps} />
              <Legend />

              {topCategories.map((category, index) => (
                <Line
                  key={`line-${category}`}
                  type="monotone"
                  dataKey={category}
                  stroke={
                    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
                    `hsl(${(index * 60) % 360}, 70%, 50%)`
                  }
                  strokeWidth={3}
                  dot={{
                    fill:
                      CATEGORY_COLORS[
                        category as keyof typeof CATEGORY_COLORS
                      ] || `hsl(${(index * 60) % 360}, 70%, 50%)`,
                    strokeWidth: 2,
                    r: 6,
                  }}
                  activeDot={{
                    r: 8,
                    fill:
                      CATEGORY_COLORS[
                        category as keyof typeof CATEGORY_COLORS
                      ] || `hsl(${(index * 60) % 360}, 70%, 50%)`,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  name={category}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie-donut":
        // Pie Chart Donut với Text
        const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)
        return (
          <div className="relative">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={150}
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
              <div className="text-2xl font-bold">
                {formatCurrency(totalAmount, currency)}
              </div>
              <div className="text-sm text-muted-foreground">Tổng chi tiêu</div>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieData.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm truncate">{item.name}</span>
                  <span className="text-sm font-medium ml-auto">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      case "radial-text":
        // Radial Chart với Text
        const radialData = pieData.slice(0, 4).map((item, index) => ({
          ...item,
          fill: item.fill,
          uv: (item.value / pieData.reduce((sum, i) => sum + i.value, 0)) * 100,
        }))

        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="90%"
              data={radialData}
            >
              <RadialBar
                minAngle={15}
                label={{ position: "insideStart", fill: "#fff", fontSize: 12 }}
                background
                clockWise
                dataKey="uv"
              >
                {radialData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RadialBar>
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Tỷ lệ"]}
                contentStyle={commonTooltipProps.contentStyle}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        )

      case "radar-multiple":
        // Radar Chart Multiple
        const radarData = chartData.slice(0, 6).map((item) => ({
          name: item.name,
          ...topCategories.reduce((acc, category) => {
            acc[category] =
              (item[category] /
                Math.max(...chartData.map((d) => d[category] || 0))) *
              100
            return acc
          }, {} as any),
        }))

        return (
          <ResponsiveContainer width="100%" height={400}>
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
                    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
                    `hsl(${(index * 120) % 360}, 70%, 50%)`
                  }
                  fill={
                    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
                    `hsl(${(index * 120) % 360}, 70%, 50%)`
                  }
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}

              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Tỷ lệ"]}
                contentStyle={commonTooltipProps.contentStyle}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )

      case "tooltip-no-indicator":
        // Bar Chart với Tooltip không có indicator
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltipNoIndicator />} />
              <Legend />

              {topCategories.map((category) => (
                <Bar
                  key={`no-indicator-${category}`}
                  dataKey={category}
                  fill={
                    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
                    `hsl(${Math.random() * 360}, 70%, 50%)`
                  }
                  name={category}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
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
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Dropdown cho Time Comparison */}
            {selectedChart === "time-comparison" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 min-w-48">
                    <span className="text-lg">
                      {comparisonOptions.find(opt => opt.value === comparisonType)?.icon}
                    </span>
                    <span className="text-sm">
                      {comparisonOptions.find(opt => opt.value === comparisonType)?.label}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {comparisonOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setComparisonType(option.value)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <span className="text-lg">{option.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.value === "weekly" && "12 tuần gần nhất"}
                          {option.value === "monthly" && "12 tháng gần nhất"}
                          {option.value === "yearly" && "5 năm gần nhất"}
                        </span>
                      </div>
                      {comparisonType === option.value && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Tabs cho Chart Types */}
            <Tabs
              value={selectedChart}
              onValueChange={(value) => setSelectedChart(value as ChartType)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-9 sm:w-auto">
                {chartTypes.map((type) => (
                  <TabsTrigger
                    key={type.value}
                    value={type.value}
                    className="flex items-center gap-1 text-xs"
                    title={type.label}
                  >
                    {type.icon}
                    <span className="hidden lg:inline text-xs">{type.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {renderChart()}

        {/* Thống kê tóm tắt */}
        {selectedChart !== "time-comparison" && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        )}
      </CardContent>
    </Card>
  )
// }siveContainer>
//         )

//       case "multiple":
//         // Bar Chart Multiple
//         return (
//           <ResponsiveContainer width="100%" height={400}>
//             <BarChart {...commonProps}>
//               <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
//               <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
//               <YAxis
//                 tick={{ fontSize: 12 }}
//                 tickLine={false}
//                 axisLine={false}
//               />
//               <Tooltip {...commonTooltipProps} />
//               <Legend />

//               {topCategories.map((category) => (
//                 <Bar
//                   key={`multiple-${category}`}
//                   dataKey={category}
//                   fill={
//                     CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
//                     `hsl(${Math.random() * 360}, 70%, 50%)`
//                   }
//                   name={category}
//                   radius={[4, 4, 0, 0]}
//                 />
//               ))}
//             </BarChart>
//           </ResponsiveContainer>
//         )

//       case "interactive":
//         // Bar Chart Interactive
//         return (
//           <ResponsiveContainer width="100%" height={400}>
//             <BarChart
//               {...commonProps}
//               onMouseMove={(data) => {
//                 if (data && data.activeLabel) {
//                   setActiveBar(data.activeLabel)
//                 }
//               }}
//               onMouseLeave={() => setActiveBar(null)}
//             >
//               <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
//               <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
//               <YAxis
//                 tick={{ fontSize: 12 }}
//                 tickLine={false}
//                 axisLine={false}
//               />
//               <Tooltip {...commonTooltipProps} />
//               <Legend />

//               {topCategories.map((category) => (
//                 <Bar
//                   key={`interactive-${category}`}
//                   dataKey={category}
//                   fill={
//                     CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
//                     `hsl(${Math.random() * 360}, 70%, 50%)`
//                   }
//                   name={category}
//                   radius={[4, 4, 0, 0]}
//                   fillOpacity={0.8}
//                   stroke={
//                     CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
//                     `hsl(${Math.random() * 360}, 70%, 50%)`
//                   }
//                   strokeWidth={activeBar ? 2 : 0}
//                 />
//               ))}
//             </BarChart>
//           </ResponsiveContainer>
//         )