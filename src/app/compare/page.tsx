/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserData, Expense, TimeFrame, ChartType } from "@/lib/types"
import { ExpenseChart } from "@/components/ui-payment/expense-chart"
// import { ExpenseSummary } from "@/components/ui-payment/expense-summary"
import {
  readJsonFile,
  isValidUserData,
  formatCurrency,
  groupExpensesByCategory,
} from "@/lib/utils"
import { FileJson, ArrowLeft } from "lucide-react"
import { TIME_FRAME_OPTIONS, CHART_TYPE_OPTIONS } from "@/lib/constants"

interface CompareData {
  file1: UserData | null
  file2: UserData | null
}

export default function CompareExpenses() {
  const [compareData, setCompareData] = useState<CompareData>({
    file1: null,
    file2: null,
  })
  const [error, setError] = useState<string>("")
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("month")
  const [chartType, setChartType] = useState<ChartType>("pie")
  const fileInputRef1 = React.useRef<HTMLInputElement>(null)
  const fileInputRef2 = React.useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileIndex: 1 | 2
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/json") {
      setError("Vui lòng chọn file JSON")
      return
    }

    try {
      const data = await readJsonFile(file)
      if (!isValidUserData(data)) {
        setError("File không hợp lệ. Vui lòng chọn file JSON đúng định dạng")
        return
      }

      setCompareData((prev) => ({
        ...prev,
        [`file${fileIndex}`]: data,
      }))
      setError("")
    } catch (err) {
      setError("Có lỗi xảy ra khi đọc file. Vui lòng thử lại")
    }
  }

  const getComparisonData = () => {
    if (!compareData.file1 || !compareData.file2) return null

    const expenses1 = compareData.file1.expenses
    const expenses2 = compareData.file2.expenses

    const categories1 = groupExpensesByCategory(expenses1)
    const categories2 = groupExpensesByCategory(expenses2)

    const allCategories = Array.from(
      new Set([...Object.keys(categories1), ...Object.keys(categories2)])
    )

    return allCategories.map((category) => ({
      name: category,
      file1: categories1[category] || 0,
      file2: categories2[category] || 0,
    }))
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">So sánh chi tiêu</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>File dữ liệu 1</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              ref={fileInputRef1}
              type="file"
              accept=".json"
              onChange={(e) => handleFileSelect(e, 1)}
              className="mb-4"
            />
            {compareData.file1 && (
              <p className="text-sm">
                Đã chọn: {compareData.file1.name || "File 1"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File dữ liệu 2</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              ref={fileInputRef2}
              type="file"
              accept=".json"
              onChange={(e) => handleFileSelect(e, 2)}
              className="mb-4"
            />
            {compareData.file2 && (
              <p className="text-sm">
                Đã chọn: {compareData.file2.name || "File 2"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {compareData.file1 && compareData.file2 && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Thời gian:</span>
              <select
                className="text-sm border rounded p-1"
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
              >
                {TIME_FRAME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Loại biểu đồ:
              </span>
              <select
                className="text-sm border rounded p-1"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
              >
                {CHART_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>So sánh biểu đồ</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart
                  expenses={compareData.file1.expenses}
                  chartType={chartType}
                  timeFrame={timeFrame}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>So sánh biểu đồ</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart
                  expenses={compareData.file2.expenses}
                  chartType={chartType}
                  timeFrame={timeFrame}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>So sánh chi tiết theo danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Danh mục</th>
                      <th className="p-2 text-right">File 1</th>
                      <th className="p-2 text-right">File 2</th>
                      <th className="p-2 text-right">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getComparisonData()?.map((item) => (
                      <tr key={item.name} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(item.file1)}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(item.file2)}
                        </td>
                        <td className="p-2 text-right">
                          <span
                            className={
                              item.file1 - item.file2 > 0
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          >
                            {formatCurrency(Math.abs(item.file1 - item.file2))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
