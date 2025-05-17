"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FirstTimeModal } from "@/components/ui-payment/first-time-modal"
import { ExpenseForm } from "@/components/ui-payment/expense-form"
import { ExpenseTable } from "@/components/ui-payment/expense-table"
import { ExpenseChart } from "@/components/ui-payment/expense-chart"
import { ExpenseSummary } from "@/components/ui-payment/expense-summary"
import { FileImportExport } from "@/components/ui-payment/file-import-export"
import { UserData, Expense, TimeFrame, ChartType } from "@/lib/types"
import {
  DEFAULT_USER_DATA,
  TIME_FRAME_OPTIONS,
  CHART_TYPE_OPTIONS,
} from "@/lib/constants"
import {
  loadUserData,
  saveUserData,
  filterExpensesByTimeFrame,
  //groupExpensesByCategory,
  //calculateTotalExpenses,
} from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BarChart, PieChart, LineChartIcon } from "lucide-react"

export default function ExpenseDashboard() {
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA)
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("month")
  const [chartType, setChartType] = useState<ChartType>("pie")
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [currency, setCurrency] = useState<"VND" | "USD">("VND")
  const router = useRouter()

  useEffect(() => {
    const data = loadUserData()
    if (data) {
      setUserData(data)
    } else {
      setShowFirstTimeModal(true)
    }
    const savedSettings = localStorage.getItem("settings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setCurrency(settings.currency || "VND")
    }
  }, [])

  useEffect(() => {
    setFilteredExpenses(filterExpensesByTimeFrame(userData.expenses, timeFrame))
  }, [userData.expenses, timeFrame])

  const handleSaveUserData = (name: string) => {
    const newUserData = {
      ...userData,
      name,
    }
    setUserData(newUserData)
    saveUserData(newUserData)
    setShowFirstTimeModal(false)
  }

  const handleAddExpense = (expense: Expense) => {
    const updatedExpenses = [...userData.expenses, expense]
    const updatedUserData = {
      ...userData,
      expenses: updatedExpenses,
    }
    setUserData(updatedUserData)
    saveUserData(updatedUserData)
  }

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = userData.expenses.filter(
      (expense) => expense.id !== id
    )
    const updatedUserData = {
      ...userData,
      expenses: updatedExpenses,
    }
    setUserData(updatedUserData)
    saveUserData(updatedUserData)
  }

  const handleImportData = (data: UserData) => {
    setUserData(data)
    saveUserData(data)
  }

  const handleExportData = () => {
    return userData
  }

  const getChartIcon = () => {
    switch (chartType) {
      case "bar":
        return <BarChart className="w-4 h-4" />
      case "pie":
        return <PieChart className="w-4 h-4" />
      case "line":
        return <LineChartIcon className="w-4 h-4" />
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý chi tiêu</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Xin chào, {userData.name}
          </span>
          <Button
            onClick={() => router.push("/compare")}
            variant="outline"
            size="sm"
          >
            So sánh dữ liệu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Thêm chi tiêu mới</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm onAddExpense={handleAddExpense} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Tổng quan chi tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseSummary expenses={filteredExpenses} timeFrame={timeFrame} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chart" className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              {getChartIcon()}
              Biểu đồ
            </TabsTrigger>
            <TabsTrigger value="table">Danh sách chi tiêu</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
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

          <FileImportExport
            onImport={handleImportData}
            onExport={handleExportData}
          />
        </div>

        <TabsContent value="chart">
          <Card>
            <CardContent className="pt-6">
              <ExpenseChart
                expenses={filteredExpenses}
                chartType={chartType}
                timeFrame={timeFrame}
                currency={currency}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              <ExpenseTable
                expenses={filteredExpenses}
                onDeleteExpense={handleDeleteExpense}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showFirstTimeModal && (
        <FirstTimeModal open={showFirstTimeModal} onSave={handleSaveUserData} />
      )}
    </div>
  )
}
