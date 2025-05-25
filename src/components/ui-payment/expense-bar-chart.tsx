/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Expense, TimeFrame } from "@/lib/types"
import { formatCurrency, groupExpensesByCategory } from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants"
import { TrendingUpIcon, ArrowDownIcon } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, Cell, LabelList } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  //ChartTooltipContent,
} from "@/components/ui/chart"

interface ExpenseBarChartProps {
  expenses: Expense[]
  timeFrame: TimeFrame
  percentageChange?: number
}

export function ExpenseBarChart({
  expenses,
  timeFrame,
  percentageChange = 0,
}: ExpenseBarChartProps) {
  // State để theo dõi theme hiện tại
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  // Theo dõi thay đổi theme
  React.useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    }

    // Check initial theme
    checkTheme()

    // Observer để theo dõi thay đổi class của html element
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])
  // Group expenses by category
  const categoriesData = groupExpensesByCategory(expenses)

  // Sort categories by amount (descending) and take top 6
  const sortedCategories = Object.entries(categoriesData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  // Prepare chart data
  const chartData = sortedCategories.map(([category, amount]) => ({
    category: category,
    amount: amount,
    fill:
      CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#888888",
  }))

  // Chart config
  const chartConfig = sortedCategories.reduce(
    (config, [category], index) => {
      const colorKey = `category-${index}`
      config[colorKey] = {
        label: category,
        color:
          CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
          "#888888",
      }
      return config
    },
    {
      amount: {
        label: "Số tiền",
      },
    } as ChartConfig
  )

  // Time frame label
  const timeFrameLabel = {
    week: "tuần này",
    month: "tháng này",
    year: "năm này",
    all: "tất cả thời gian",
  }[timeFrame]

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: data.fill }}
            />
            <span className="font-medium">{data.category}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Số tiền:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(data.amount)}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom Bar component with theme-aware glow
  const CustomBar = (props: any) => {
    const { payload, x, y, width, height } = props
    const color = payload.fill

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={5}
        fill={color}
        style={{
          filter: isDarkMode
            ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 18px ${color}35)`
            : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
        }}
      />
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Biểu đồ chi tiêu theo danh mục</CardTitle>
          <CardDescription>Chi tiêu {timeFrameLabel}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground text-center">
            Không có dữ liệu chi tiêu trong {timeFrameLabel}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Biểu đồ chi tiêu theo danh mục</CardTitle>
        <CardDescription>
          Chi tiêu {timeFrameLabel} - Top {chartData.length} danh mục
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-visible h-full">
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 20,
              right: 20,
              top: 10,
              bottom: 10,
            }}
          >
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              width={0}
              hide
            />
            <XAxis dataKey="amount" type="number" hide />
            <ChartTooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
              content={<CustomTooltip />}
            />
            <Bar
              dataKey="amount"
              layout="vertical"
              radius={5}
              shape={<CustomBar />}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="category"
                position="insideLeft"
                offset={10}
                className="fill-white font-semibold text-sm"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      {timeFrame !== "all" && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            {percentageChange > 0 ? (
              <>
                Tăng {percentageChange.toFixed(1)}% so với kỳ trước
                <TrendingUpIcon className="h-4 w-4" />
              </>
            ) : percentageChange < 0 ? (
              <>
                Giảm {Math.abs(percentageChange).toFixed(1)}% so với kỳ trước
                <ArrowDownIcon className="h-4 w-4" />
              </>
            ) : (
              "Không thay đổi so với kỳ trước"
            )}
          </div>
          <div className="leading-none text-muted-foreground">
            Hiển thị tổng chi tiêu {timeFrameLabel} theo từng danh mục
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
