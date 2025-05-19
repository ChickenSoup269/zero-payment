"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Task, TaskFilters, Priority, Status } from "@/lib/types"
import {
  generateId,
  getCurrentDateFormatted,
  // loadUserData,
  getPriorityColor,
  getStatusColor,
  getPriorityLabel,
  getStatusLabel,
  formatDate,
  taskToCSV,
  exportToJSON,
} from "@/lib/utils"
import {
  Search,
  Plus,
  Calendar,
  Download,
  FolderPlus,
  File,
  Trash2,
  FileJson,
  ChevronDown,
} from "lucide-react"
import { debounce } from "lodash"

// Define form data type
type TaskFormData = Omit<Task, "id" | "createdAt">

// Define file type
type TaskFile = {
  id: string
  name: string
  createdAt: string
}

// NewTaskDialog component
function NewTaskDialog({
  isOpen,
  onOpenChange,
  onAddTask,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddTask: (task: Task) => void
}) {
  const { register, handleSubmit, reset, watch } = useForm<TaskFormData>({
    defaultValues: {
      title: "",
      description: "",
      priority: "normal" as Priority,
      status: "todo" as Status,
    },
  })

  const onSubmit = (data: TaskFormData) => {
    const task: Task = {
      id: generateId(),
      ...data,
      createdAt: getCurrentDateFormatted(),
      // Format dueDate only if provided
      dueDate: data.dueDate
        ? formatDate(
            new Date(data.dueDate)
              .toLocaleDateString("en-GB")
              .split("/")
              .reverse()
              .join("-")
          )
        : undefined,
    }
    onAddTask(task)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm công việc
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm công việc mới</DialogTitle>
          <DialogDescription>
            Điền thông tin công việc mới của bạn
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Tiêu đề</Label>
            <Input
              id="title"
              placeholder="Nhập tiêu đề công việc"
              {...register("title", { required: true })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết công việc"
              {...register("description")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Ưu tiên</Label>
              <Select value={watch("priority")} {...register("priority")}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mức độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Cần làm</SelectItem>
                  <SelectItem value="tomorrow">Cần làm vào ngày mai</SelectItem>
                  <SelectItem value="urgent">Cần gấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={watch("status")} {...register("status")}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Cần làm</SelectItem>
                  <SelectItem value="preparing">Chuẩn bị</SelectItem>
                  <SelectItem value="in-progress">Đang làm</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dueDate">Hạn cuối (nếu có)</Label>
            <div className="flex items-center gap-2">
              <Input id="dueDate" type="date" {...register("dueDate")} />
              <Calendar className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!watch("title")}>
              Thêm công việc
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// New File Dialog Component
function NewFileDialog({
  isOpen,
  onOpenChange,
  onCreateFile,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreateFile: (fileName: string) => void
}) {
  const [fileName, setFileName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (fileName) {
      onCreateFile(fileName)
      setFileName("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="mr-2 h-4 w-4" />
          Tạo file mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo file mới</DialogTitle>
          <DialogDescription>
            Nhập tên cho file công việc mới của bạn
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="new-file-name">Tên file</Label>
            <Input
              id="new-file-name"
              placeholder="Nhập tên file (không cần .json)"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!fileName}>
              Tạo file
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// File Select Component
function FileSelect({
  files,
  currentFile,
  onFileSelect,
  onDeleteFile,
}: {
  files: TaskFile[]
  currentFile: string
  onFileSelect: (fileId: string) => void
  onDeleteFile: (fileId: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex gap-2 items-center">
          <FileJson className="h-4 w-4" />
          {files.find((f) => f.id === currentFile)?.name || "Chọn file"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Danh sách file</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {files.length > 0 ? (
          files.map((file) => (
            <DropdownMenuItem
              key={file.id}
              className="flex justify-between"
              onClick={() => onFileSelect(file.id)}
            >
              <div className="flex items-center">
                <File className="mr-2 h-4 w-4" />
                <span>{file.name}</span>
              </div>
              {files.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteFile(file.id)
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>Không có file nào</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [filters, setFilters] = useState<TaskFilters>({
    priority: "all",
    status: "all",
    searchTerm: "",
  })
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [files, setFiles] = useState<TaskFile[]>([])
  const [currentFileId, setCurrentFileId] = useState<string>("")
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false)
  const [fileName, setFileName] = useState("")

  // Helper function to load tasks for a specific file
  const loadTasksForFile = useCallback((fileId: string) => {
    const savedTasks = localStorage.getItem(`tasks_${fileId}`)
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    } else {
      setTasks([])
    }
    setCurrentFileId(fileId)
  }, [])

  // Load files and tasks on initial render
  useEffect(() => {
    const savedFiles = localStorage.getItem("taskFiles")

    if (savedFiles) {
      const parsedFiles = JSON.parse(savedFiles) as TaskFile[]
      setFiles(parsedFiles)

      // If there are files, load the first one
      if (parsedFiles.length > 0) {
        const lastActiveFileId =
          localStorage.getItem("lastActiveFileId") || parsedFiles[0].id
        loadTasksForFile(lastActiveFileId)
        setIsFirstTime(false)
      }
    }
  }, [loadTasksForFile])

  // Update filtered tasks when tasks or filters change
  useEffect(() => {
    let result = [...tasks]

    if (filters.priority !== "all") {
      result = result.filter((task) => task.priority === filters.priority)
    }

    if (filters.status !== "all") {
      result = result.filter((task) => task.status === filters.status)
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          task.description.toLowerCase().includes(term)
      )
    }

    setFilteredTasks(result)
  }, [tasks, filters])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (currentFileId) {
      localStorage.setItem(`tasks_${currentFileId}`, JSON.stringify(tasks))
    }
  }, [tasks, currentFileId])

  // Save current file id to localStorage
  useEffect(() => {
    if (currentFileId) {
      localStorage.setItem("lastActiveFileId", currentFileId)
    }
  }, [currentFileId])

  // Debounce search input
  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setFilters((prev) => ({ ...prev, searchTerm: value }))
    }, 300),
    []
  )

  const handleCreateFirstFile = () => {
    if (!fileName) return

    const newFileId = generateId()
    const newFile: TaskFile = {
      id: newFileId,
      name: fileName,
      createdAt: getCurrentDateFormatted(),
    }

    setFiles([newFile])
    localStorage.setItem("taskFiles", JSON.stringify([newFile]))
    localStorage.setItem(`tasks_${newFileId}`, JSON.stringify([]))
    setCurrentFileId(newFileId)
    setIsFirstTime(false)
  }

  const handleCreateFile = (fileName: string) => {
    const newFileId = generateId()
    const newFile: TaskFile = {
      id: newFileId,
      name: fileName,
      createdAt: getCurrentDateFormatted(),
    }

    const updatedFiles = [...files, newFile]
    setFiles(updatedFiles)
    localStorage.setItem("taskFiles", JSON.stringify(updatedFiles))
    localStorage.setItem(`tasks_${newFileId}`, JSON.stringify([]))
    setCurrentFileId(newFileId)
  }

  const handleFileSelect = (fileId: string) => {
    loadTasksForFile(fileId)
  }

  const handleDeleteFile = (fileId: string) => {
    // Don't allow deleting if it's the only file
    if (files.length <= 1) return

    const updatedFiles = files.filter((f) => f.id !== fileId)
    setFiles(updatedFiles)
    localStorage.setItem("taskFiles", JSON.stringify(updatedFiles))

    // Remove tasks for this file
    localStorage.removeItem(`tasks_${fileId}`)

    // If the current file is being deleted, switch to another file
    if (fileId === currentFileId) {
      const nextFileId = updatedFiles[0].id
      loadTasksForFile(nextFileId)
    }
  }

  const handleAddTask = (task: Task) => {
    setTasks((prev) => [...prev, task])
  }

  const handleUpdateTaskStatus = (id: string, status: Status) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status } : task))
    )
  }

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const handleExportCSV = () => {
    const csvContent = taskToCSV(tasks)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${
        files.find((f) => f.id === currentFileId)?.name || "tasks"
      }-${getCurrentDateFormatted()}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportJSON = () => {
    const jsonContent = exportToJSON(tasks)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${files.find((f) => f.id === currentFileId)?.name || "tasks"}.json`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isFirstTime) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Chào mừng đến với Quản lý công việc</CardTitle>
            <CardDescription>
              Đây là lần đầu tiên bạn sử dụng ứng dụng này. Vui lòng đặt tên cho
              file lưu trữ công việc đầu tiên của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-name">Tên file</Label>
                <Input
                  id="file-name"
                  placeholder="Nhập tên file (không cần .json)"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleCreateFirstFile}
              disabled={!fileName}
            >
              Bắt đầu
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý công việc</h1>
        <div className="flex gap-2">
          <FileSelect
            files={files}
            currentFile={currentFileId}
            onFileSelect={handleFileSelect}
            onDeleteFile={handleDeleteFile}
          />
          <NewFileDialog
            isOpen={isNewFileDialogOpen}
            onOpenChange={setIsNewFileDialogOpen}
            onCreateFile={handleCreateFile}
          />
          <NewTaskDialog
            isOpen={isNewTaskDialogOpen}
            onOpenChange={setIsNewTaskDialogOpen}
            onAddTask={handleAddTask}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportJSON}>
              <Download className="mr-2 h-4 w-4" />
              JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm công việc..."
              className="pl-10"
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="w-48">
              <Select
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    priority: value as Priority | "all",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả ưu tiên</SelectItem>
                  <SelectItem value="normal">Cần làm</SelectItem>
                  <SelectItem value="tomorrow">Cần làm vào ngày mai</SelectItem>
                  <SelectItem value="urgent">Cần gấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value as Status | "all",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="todo">Cần làm</SelectItem>
                  <SelectItem value="preparing">Chuẩn bị</SelectItem>
                  <SelectItem value="in-progress">Đang làm</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="todo">Cần làm</TabsTrigger>
            <TabsTrigger value="preparing">Chuẩn bị</TabsTrigger>
            <TabsTrigger value="in-progress">Đang làm</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
          </TabsList>

          {["all", "todo", "preparing", "in-progress", "completed"].map(
            (tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {filteredTasks.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    Không có công việc nào{" "}
                    {tab !== "all"
                      ? `có trạng thái ${getStatusLabel(tab as Status)}`
                      : ""}
                  </div>
                )}

                {filteredTasks
                  .filter((task) => tab === "all" || task.status === tab)
                  .map((task) => (
                    <Card key={task.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">
                            {task.title}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusLabel(task.status)}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>Tạo ngày: {formatDate(task.createdAt)}</span>
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                Hạn cuối: {formatDate(task.dueDate)}
                              </span>
                            </>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{task.description}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t pt-4">
                        <div className="flex gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(value: Status) =>
                              handleUpdateTaskStatus(task.id, value)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Cập nhật trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">Cần làm</SelectItem>
                              <SelectItem value="preparing">
                                Chuẩn bị
                              </SelectItem>
                              <SelectItem value="in-progress">
                                Đang làm
                              </SelectItem>
                              <SelectItem value="completed">
                                Hoàn thành
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Xóa
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </TabsContent>
            )
          )}
        </Tabs>
      </div>
    </div>
  )
}
