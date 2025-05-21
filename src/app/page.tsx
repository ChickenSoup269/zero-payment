"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FirstTimeModal } from "@/components/ui-payment/first-time-modal"
import { ExpenseFormDialog } from "@/components/ui-payment/expense-form-dialog"
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
  getAvailableFiles,
  saveAvailableFiles,
  deleteUserData,
} from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BarChart, PieChart, LineChartIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function ExpenseDashboard() {
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA)
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("month")
  const [chartType, setChartType] = useState<ChartType>("pie")
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [currency, setCurrency] = useState<"VND" | "USD">("VND")
  const [availableFiles, setAvailableFiles] = useState<string[]>([])
  const [currentFile, setCurrentFile] = useState<string>("default")
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const router = useRouter()

  useEffect(() => {
    const files = getAvailableFiles()
    setAvailableFiles(files)
    const data = loadUserData(currentFile)
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
  }, [currentFile])

  useEffect(() => {
    setFilteredExpenses(filterExpensesByTimeFrame(userData.expenses, timeFrame))
  }, [userData.expenses, timeFrame])

  const handleSaveUserData = (name: string) => {
    const newUserData = {
      ...userData,
      name,
    }
    setUserData(newUserData)
    saveUserData(newUserData, currentFile)
    setShowFirstTimeModal(false)
  }

  const handleAddExpense = (expense: Expense) => {
    const updatedExpenses = [...userData.expenses, expense]
    const updatedUserData = {
      ...userData,
      expenses: updatedExpenses,
    }
    setUserData(updatedUserData)
    saveUserData(updatedUserData, currentFile)
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
    saveUserData(updatedUserData, currentFile)
  }

  const handleImportData = (data: UserData, fileName: string) => {
    setUserData(data)
    saveUserData(data, fileName)
    if (!availableFiles.includes(fileName)) {
      const updatedFiles = [...availableFiles, fileName]
      setAvailableFiles(updatedFiles)
      saveAvailableFiles(updatedFiles)
    }
    setCurrentFile(fileName)
  }

  const handleExportData = () => {
    return userData
  }

  const handleCreateNewFile = () => {
    if (newFileName.trim() === "") {
      alert("Vui lòng nhập tên file")
      return
    }
    const sanitizedFileName = newFileName.trim().replace(/[^a-zA-Z0-9-_]/g, "")
    if (availableFiles.includes(sanitizedFileName)) {
      alert("Tên file đã tồn tại, vui lòng chọn tên khác")
      return
    }
    const updatedFiles = [...availableFiles, sanitizedFileName]
    setAvailableFiles(updatedFiles)
    saveAvailableFiles(updatedFiles)
    setCurrentFile(sanitizedFileName)
    setUserData(DEFAULT_USER_DATA)
    saveUserData(DEFAULT_USER_DATA, sanitizedFileName)
    setShowNewFileModal(false)
    setNewFileName("")
  }

  const handleDeleteFile = () => {
    if (currentFile === "default") {
      alert("Không thể xóa file mặc định")
      return
    }
    if (confirm(`Bạn có chắc muốn xóa file "${currentFile}"?`)) {
      deleteUserData(currentFile)
      const updatedFiles = availableFiles.filter((file) => file !== currentFile)
      setAvailableFiles(updatedFiles)
      saveAvailableFiles(updatedFiles)
      setCurrentFile("default")
      const defaultData = loadUserData("default")
      setUserData(defaultData || DEFAULT_USER_DATA)
    }
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">File:</span>
            <select
              className="text-sm border rounded p-1"
              value={currentFile}
              onChange={(e) => setCurrentFile(e.target.value)}
            >
              {availableFiles.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
            <Button
              onClick={() => setShowNewFileModal(true)}
              variant="outline"
              size="sm"
            >
              Tạo file mới
            </Button>
            <ExpenseFormDialog onAddExpense={handleAddExpense} />
            <Button
              onClick={handleDeleteFile}
              variant="destructive"
              size="sm"
              disabled={currentFile === "default"}
            >
              Xóa file
            </Button>
          </div>
          <Button
            onClick={() => router.push("/compare")}
            variant="outline"
            size="sm"
          >
            So sánh dữ liệu
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 md:grid-cols-2 sm:grid-cols-3  gap-6 mb-6 ">
        <Card>
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

      <Dialog open={showNewFileModal} onOpenChange={setShowNewFileModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo file chi tiêu mới</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nhập tên file"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewFileModal(false)
                setNewFileName("")
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateNewFile}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
