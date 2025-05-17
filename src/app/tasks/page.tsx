/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  X,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Download,
  Upload,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  generateId,
  getPriorityLabel,
  getStatusLabel,
  exportToJSON,
  readJsonFile,
} from "@/lib/utils"
import jsPDF from "jspdf"
import { Task } from "@/lib/types"

// Define types for our application
interface TaskFilters {
  priority: string
  searchTerm: string
}

// Task Filter Component
const TaskFilter = ({
  filters,
  onFilterChange,
}: {
  filters: TaskFilters
  onFilterChange: (filters: TaskFilters) => void
}) => {
  const handleResetFilters = () => {
    onFilterChange({
      priority: "all",
      searchTerm: "",
    })
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Tìm kiếm công việc..."
            value={filters.searchTerm}
            onChange={(e) =>
              onFilterChange({ ...filters, searchTerm: e.target.value })
            }
            className="w-full"
          />
          {filters.searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFilterChange({ ...filters, searchTerm: "" })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex space-x-2">
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              onFilterChange({ ...filters, priority: value })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="tomorrow">Cần làm vào ngày mai</SelectItem>
              <SelectItem value="normal">Cần làm</SelectItem>
              <SelectItem value="urgent">Cần gấp</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleResetFilters}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Task Card Component
const TaskCard = ({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task
  onStatusChange: (taskId: string, newStatus: string) => void
  onDelete: (taskId: string) => void
}) => {
  const priorityClasses = {
    urgent: "bg-red-100 text-red-800 border-red-200",
    normal: "bg-blue-100 text-blue-800 border-blue-200",
    tomorrow: "bg-amber-100 text-amber-800 border-amber-200",
  }

  const statusClasses = {
    todo: "bg-gray-100 text-gray-800",
    "in-progress": "bg-purple-100 text-purple-800",
    preparing: "bg-teal-100 text-teal-800",
    completed: "bg-green-100 text-green-800",
  }

  const statusIcons = {
    todo: <Clock className="h-4 w-4 mr-1" />,
    "in-progress": <Calendar className="h-4 w-4 mr-1" />,
    preparing: <Calendar className="h-4 w-4 mr-1" />,
    completed: <CheckCircle2 className="h-4 w-4 mr-1" />,
  }

  const statusLabels = {
    todo: "Cần làm",
    "in-progress": "Đang làm",
    preparing: "Chuẩn bị",
    completed: "Hoàn thành",
  }

  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-lg">{task.title}</h3>
        <div className="flex space-x-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              priorityClasses[task.priority]
            }`}
          >
            {getPriorityLabel(task.priority)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              console.log("Delete button clicked for task:", task.id)
              onDelete(task.id)
            }}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-4">{task.description}</p>
      <div className="flex items-center justify-between">
        <Select
          value={task.status}
          onValueChange={(value) => onStatusChange(task.id, value)}
        >
          <SelectTrigger
            className={`h-8 w-40 text-xs ${statusClasses[task.status]}`}
          >
            <SelectValue>
              <div className="flex items-center">
                {statusIcons[task.status]}
                {statusLabels[task.status]}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">Cần làm</SelectItem>
            <SelectItem value="in-progress">Đang làm</SelectItem>
            <SelectItem value="preparing">Chuẩn bị</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-500">
          {new Date(task.createdAt).toLocaleDateString("vi-VN")}
        </span>
      </div>
    </div>
  )
}

// New Task Form Component
const NewTaskForm = ({
  onAddTask,
  onClose,
}: {
  onAddTask: (task: Task) => void
  onClose: () => void
}) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Task["priority"]>("normal")
  const [status, setStatus] = useState<Task["status"]>("todo")
  const [dueDate, setDueDate] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Tiêu đề là bắt buộc")
      return
    }

    const newTask: Task = {
      id: generateId(),
      title,
      description,
      priority,
      status,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
    }

    console.log("Adding new task:", newTask)
    onAddTask(newTask)
    onClose()
    // Reset form
    setTitle("")
    setDescription("")
    setPriority("normal")
    setStatus("todo")
    setDueDate("")
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Tiêu đề</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError(null)
          }}
          placeholder="Nhập tiêu đề công việc"
          required
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Nhập mô tả công việc"
        />
      </div>
      <div>
        <Label htmlFor="priority">Ưu tiên</Label>
        <Select
          value={priority}
          onValueChange={(value) => setPriority(value as Task["priority"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tomorrow">Cần làm vào ngày mai</SelectItem>
            <SelectItem value="normal">Cần làm</SelectItem>
            <SelectItem value="urgent">Cần gấp</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Trạng thái</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as Task["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">Cần làm</SelectItem>
            <SelectItem value="in-progress">Đang làm</SelectItem>
            <SelectItem value="preparing">Chuẩn bị</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="dueDate">Hạn cuối (tùy chọn)</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit">Thêm công việc</Button>
      </div>
    </form>
  )
}

// Main Page Component
export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filters, setFilters] = useState<TaskFilters>({
    priority: "all",
    searchTerm: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Log tasks whenever they change
  useEffect(() => {
    console.log("Current tasks:", tasks)
  }, [tasks])

  // Load tasks from task.json on mount
  useEffect(() => {
    async function loadTasks() {
      try {
        const tasksModule = await import("@/data/task.json")
        const data = tasksModule.default || tasksModule
        if (
          Array.isArray(data) &&
          data.every(
            (task) =>
              task.id &&
              task.title &&
              task.description &&
              ["tomorrow", "normal", "urgent"].includes(task.priority) &&
              ["todo", "in-progress", "preparing", "completed"].includes(
                task.status
              ) &&
              task.createdAt
          )
        ) {
          setTasks(data as Task[])
        } else {
          setError("Dữ liệu trong task.json không hợp lệ.")
        }
      } catch (err) {
        setError("Không thể tải dữ liệu từ task.json. Vui lòng kiểm tra file.")
      } finally {
        setIsLoading(false)
      }
    }
    loadTasks()
  }, [])

  // Filter tasks based on current filter settings
  const filterTasks = () => {
    return tasks.filter((task) => {
      const matchesSearch =
        filters.searchTerm === "" ||
        task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        task.description
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase())

      const matchesPriority =
        filters.priority === "all" || task.priority === filters.priority

      return matchesSearch && matchesPriority
    })
  }

  // Handle task status change
  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus as Task["status"] }
          : task
      )
    )
  }

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    console.log("Deleting task:", taskId)
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  // Handle adding new task
  const handleAddTask = (newTask: Task) => {
    console.log("Adding task:", newTask)
    setTasks((prevTasks) => [...prevTasks, newTask])
  }

  // Export to JSON
  const handleExportJSON = () => {
    const jsonString = exportToJSON(tasks)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tasks.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Danh sách công việc", 20, 20)

    let y = 30
    tasks.forEach((task, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.setFontSize(12)
      doc.text(`Công việc ${index + 1}: ${task.title}`, 20, y)
      doc.text(`Mô tả: ${task.description}`, 20, y + 10)
      doc.text(`Ưu tiên: ${getPriorityLabel(task.priority)}`, 20, y + 20)
      doc.text(`Trạng thái: ${getStatusLabel(task.status)}`, 20, y + 30)
      doc.text(
        `Ngày tạo: ${new Date(task.createdAt).toLocaleDateString("vi-VN")}`,
        20,
        y + 40
      )
      if (task.dueDate) {
        doc.text(
          `Hạn cuối: ${new Date(task.dueDate).toLocaleDateString("vi-VN")}`,
          20,
          y + 50
        )
        y += 60
      } else {
        y += 50
      }
      doc.line(20, y, 190, y)
      y += 10
    })

    doc.save("tasks.pdf")
  }

  // Handle JSON import
  const handleImportJSON = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await readJsonFile(file)
      if (
        Array.isArray(data) &&
        data.every(
          (task) =>
            task.id &&
            task.title &&
            task.description &&
            ["tomorrow", "normal", "urgent"].includes(task.priority) &&
            ["todo", "in-progress", "preparing", "completed"].includes(
              task.status
            ) &&
            task.createdAt
        )
      ) {
        setTasks(data as Task[])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        alert("File JSON không hợp lệ. Vui lòng kiểm tra định dạng.")
      }
    } catch (error) {
      alert("Lỗi khi đọc file JSON. Vui lòng thử lại.")
    }
  }

  // Render loading or error state
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Đang tải...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-red-600">{error}</div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý công việc</h1>
        <div className="flex space-x-2">
          <Button onClick={handleExportJSON} variant="outline">
            <Download className="h-4 w-4 mr-2" /> Xuất JSON
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" /> Xuất PDF
          </Button>
          <Button asChild variant="outline">
            <label>
              <Upload className="h-4 w-4 mr-2" /> Nhập JSON
              <Input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
                ref={fileInputRef}
              />
            </label>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Thêm công việc mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm công việc mới</DialogTitle>
              </DialogHeader>
              <NewTaskForm
                onAddTask={handleAddTask}
                onClose={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TaskFilter filters={filters} onFilterChange={setFilters} />

      <Tabs defaultValue="card" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="card">Card View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="card">
          {filterTasks().length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                Không có công việc nào phù hợp với bộ lọc hiện tại
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilters({ priority: "all", searchTerm: "" })}
              >
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTasks().map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="list">
          {filterTasks().length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                Không có công việc nào phù hợp với bộ lọc hiện tại
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilters({ priority: "all", searchTerm: "" })}
              >
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Tiêu đề</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="w-[150px]">Ưu tiên</TableHead>
                  <TableHead className="w-[150px]">Trạng thái</TableHead>
                  <TableHead className="w-[120px]">Ngày tạo</TableHead>
                  <TableHead className="w-[120px]">Hạn cuối</TableHead>
                  <TableHead className="w-[100px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterTasks().map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "tomorrow"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        onValueChange={(value) =>
                          handleStatusChange(task.id, value)
                        }
                      >
                        <SelectTrigger
                          className={`h-8 w-32 text-xs ${
                            task.status === "todo"
                              ? "bg-gray-100 text-gray-800"
                              : task.status === "in-progress"
                              ? "bg-purple-100 text-purple-800"
                              : task.status === "preparing"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          <SelectValue>
                            <div className="flex items-center">
                              {task.status === "todo" && (
                                <Clock className="h-4 w-4 mr-1" />
                              )}
                              {task.status === "in-progress" && (
                                <Calendar className="h-4 w-4 mr-1" />
                              )}
                              {task.status === "preparing" && (
                                <Calendar className="h-4 w-4 mr-1" />
                              )}
                              {task.status === "completed" && (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                              )}
                              {getStatusLabel(task.status)}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">Cần làm</SelectItem>
                          <SelectItem value="in-progress">Đang làm</SelectItem>
                          <SelectItem value="preparing">Chuẩn bị</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(task.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("vi-VN")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          console.log(
                            "Delete button clicked for task:",
                            task.id
                          )
                          handleDeleteTask(task.id)
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
