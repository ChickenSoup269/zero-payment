"use client"
import { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts"
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
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import _ from "lodash"

// Types
type Priority = "normal" | "tomorrow" | "urgent"
type Status = "todo" | "preparing" | "in-progress" | "completed"

interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  createdAt: string
  dueDate?: string
  completionPercentage: number
  subtasks: Subtask[]
}

interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface TaskFilters {
  priority: Priority | "all"
  status: Status | "all"
  searchTerm: string
}

interface TaskFile {
  id: string
  name: string
  createdAt: string
  tasks: Task[]
}

interface TaskFormData {
  title: string
  description: string
  priority: Priority
  status: Status
  dueDate?: string
}

// Utility functions
const generateId = (): string =>
  `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const getCurrentDateFormatted = (): string =>
  new Date().toISOString().split("T")[0]

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

const getPriorityColor = (priority: Priority): string =>
  ({
    normal: "bg-blue-100 text-blue-800",
    tomorrow: "bg-yellow-100 text-yellow-800",
    urgent: "bg-red-100 text-red-800",
  }[priority] || "bg-gray-100 text-gray-800")

const getStatusColor = (status: Status): string =>
  ({
    todo: "bg-gray-100 text-gray-800",
    preparing: "bg-purple-100 text-purple-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  }[status] || "bg-gray-100 text-gray-800")

const getPriorityLabel = (priority: Priority): string =>
  ({
    normal: "Cần làm",
    tomorrow: "Cần làm vào ngày mai",
    urgent: "Cần gấp",
  }[priority] || "Cần làm")

const getStatusLabel = (status: Status): string =>
  ({
    todo: "Cần làm",
    preparing: "Chuẩn bị",
    "in-progress": "Đang làm",
    completed: "Hoàn thành",
  }[status] || "Cần làm")

const taskToCSV = (tasks: Task[]): string => {
  const headers = [
    "ID",
    "Tiêu đề",
    "Mô tả",
    "Ưu tiên",
    "Trạng thái",
    "Ngày tạo",
    "Hạn cuối",
    "Phần trăm hoàn thành",
  ]
  const rows = tasks.map((task) => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`,
    `"${task.description.replace(/"/g, '""')}"`,
    task.priority,
    task.status,
    task.createdAt,
    task.dueDate || "",
    task.completionPercentage || 0,
  ])
  return [headers, ...rows].map((row) => row.join(",")).join("\n")
}

const exportToJSON = (tasks: Task[]): string => JSON.stringify(tasks, null, 2)

// Simple Progress Bar Component
const SimpleProgressBar = ({ percentage }: { percentage: number }) => (
  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-blue-500 transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
    />
  </div>
)

// Donut Progress Component
const DonutProgress = ({ percentage }: { percentage: number }) => {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-12 h-12">
      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-500 transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium">{percentage}%</span>
      </div>
    </div>
  )
}

// NewTaskDialog Component
function NewTaskDialog({
  isOpen,
  onOpenChange,
  onAddTask,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddTask: (task: Task) => void
}) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "normal",
    status: "todo",
    dueDate: "",
  })
  const [subtaskInput, setSubtaskInput] = useState<string>("")
  const [subtaskList, setSubtaskList] = useState<Subtask[]>([])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "normal",
      status: "todo",
      dueDate: "",
    })
    setSubtaskInput("")
    setSubtaskList([])
  }

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtaskList([
        ...subtaskList,
        { id: generateId(), title: subtaskInput.trim(), completed: false },
      ])
      setSubtaskInput("")
    }
  }

  const removeSubtask = (id: string) => {
    setSubtaskList(subtaskList.filter((st) => st.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const task: Task = {
      id: generateId(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: formData.status,
      createdAt: getCurrentDateFormatted(),
      dueDate: formData.dueDate || undefined,
      completionPercentage: 0,
      subtasks: subtaskList,
    }

    onAddTask(task)
    resetForm()
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm công việc mới</DialogTitle>
          <DialogDescription>
            Điền thông tin công việc mới của bạn
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              placeholder="Nhập tiêu đề công việc"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết công việc"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Ưu tiên</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Select
                value={formData.status}
                onValueChange={(value: Status) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
              <Calendar className="h-4 w-4 text-gray-500" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subtask">Công việc con</Label>
            <div className="flex gap-2">
              <Input
                id="subtask"
                placeholder="Nhập công việc con"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addSubtask())
                }
              />
              <Button
                type="button"
                onClick={addSubtask}
                disabled={!subtaskInput.trim()}
              >
                Thêm
              </Button>
            </div>

            {subtaskList.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {subtaskList.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{subtask.title}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              Thêm công việc
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// NewFileDialog Component
function NewFileDialog({
  isOpen,
  onOpenChange,
  onCreateFile,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreateFile: (fileName: string) => void
}) {
  const [fileName, setFileName] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (fileName.trim()) {
      onCreateFile(fileName.trim())
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
              placeholder="Nhập tên file"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFileName("")
                onOpenChange(false)
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!fileName.trim()}>
              Tạo file
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// FileSelect Component
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
  const currentFileName =
    files.find((f) => f.id === currentFile)?.name || "Chọn file"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex gap-2 items-center">
          <FileJson className="h-4 w-4" />
          <span className="max-w-32 truncate">{currentFileName}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Danh sách file ({files.length})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {files.length > 0 ? (
          files.map((file) => (
            <DropdownMenuItem
              key={file.id}
              className="flex justify-between items-center"
            >
              <div
                className="flex items-center flex-1 cursor-pointer"
                onClick={() => onFileSelect(file.id)}
              >
                <File className="mr-2 h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {file.tasks.length} công việc
                  </div>
                </div>
              </div>
              {files.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-2"
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

// TaskCard Component
function TaskCard({
  task,
  onUpdateStatus,
  onDelete,
  onUpdateSubtask,
}: {
  task: Task
  onUpdateStatus: (id: string, status: Status) => void
  onDelete: (id: string) => void
  onUpdateSubtask: (
    id: string,
    subtasks: Subtask[],
    completionPercentage: number
  ) => void
}) {
  const handleSubtaskToggle = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((subtask) =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    )

    const completionPercentage =
      updatedSubtasks.length > 0
        ? Math.round(
            (updatedSubtasks.filter((s) => s.completed).length /
              updatedSubtasks.length) *
              100
          )
        : 0

    onUpdateSubtask(task.id, updatedSubtasks, completionPercentage)
  }

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "completed"

  return (
    <Card
      className={`overflow-hidden  ${
        isOverdue ? "border-red-200 bg-red-50" : ""
      }`}
    >
      <CardHeader className="pb-2 pt-3 ">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl capitalize">{task.title}</CardTitle>
            <CardDescription className="text-xs flex items-center gap-2 mt-1">
              <span>
                Tạo ngày: <Badge> {formatDate(task.createdAt)}</Badge>
              </span>
              {task.dueDate && (
                <>
                  <span>•</span>
                  <span
                    className={`flex items-center ${
                      isOverdue ? "text-red-600 font-medium" : ""
                    }`}
                  >
                    <Calendar className="mr-1 h-3 w-3" />
                    Ngày hết hạn:<Badge>{formatDate(task.dueDate)}</Badge>
                    {isOverdue && <AlertTriangle className="ml-1 h-3 w-3" />}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex  flex-col gap-2">
            <Badge className={getPriorityColor(task.priority)}>
              {getPriorityLabel(task.priority)}
            </Badge>
            <Badge className={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        {task.description && (
          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Tiến độ</Label>
            <div className="flex items-center gap-4 mt-2">
              <Progress value={task.completionPercentage} className="flex-1" />
              <div className="flex items-center gap-2">
                <SimpleProgressBar percentage={task.completionPercentage} />
                <DonutProgress percentage={task.completionPercentage} />
              </div>
            </div>
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <Label className="text-sm font-medium">
                Công việc con ({task.subtasks.filter((s) => s.completed).length}
                /{task.subtasks.length})
              </Label>
              <div className="space-y-1 mt-2 max-h-24 overflow-y-auto">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleSubtaskToggle(subtask.id)}
                  >
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        subtask.completed ? "text-green-500" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        subtask.completed ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-3 pb-3">
        <Select
          value={task.status}
          onValueChange={(value: Status) => onUpdateStatus(task.id, value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">Cần làm</SelectItem>
            <SelectItem value="preparing">Chuẩn bị</SelectItem>
            <SelectItem value="in-progress">Đang làm</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

// Main TasksPage Component
export default function TasksPage() {
  const [files, setFiles] = useState<TaskFile[]>([])
  const [currentFileId, setCurrentFileId] = useState<string>("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [filters, setFilters] = useState<TaskFilters>({
    priority: "all",
    status: "all",
    searchTerm: "",
  })
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState<boolean>(false)
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState<boolean>(false)
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true)
  const [fileName, setFileName] = useState<string>("")

  // Load files from localStorage on mount
  useEffect(() => {
    const savedFiles = localStorage.getItem("taskFiles")
    if (savedFiles) {
      const parsedFiles: TaskFile[] = JSON.parse(savedFiles)
      if (parsedFiles.length > 0) {
        setFiles(parsedFiles)
        setCurrentFileId(parsedFiles[0].id)
        setIsFirstTime(false)
      } else {
        // Initialize with default file if no files exist
        const defaultFile: TaskFile = {
          id: generateId(),
          name: "Công việc chính",
          createdAt: getCurrentDateFormatted(),
          tasks: [],
        }
        setFiles([defaultFile])
        setCurrentFileId(defaultFile.id)
        setIsFirstTime(false)
      }
    } else {
      // Initialize with default file if no data in localStorage
      const defaultFile: TaskFile = {
        id: generateId(),
        name: "Công việc chính",
        createdAt: getCurrentDateFormatted(),
        tasks: [],
      }
      setFiles([defaultFile])
      setCurrentFileId(defaultFile.id)
      setIsFirstTime(false)
    }
  }, [])

  // Save files to localStorage whenever files change
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem("taskFiles", JSON.stringify(files))
    }
  }, [files])

  // Update tasks when current file changes
  useEffect(() => {
    const currentFile = files.find((f) => f.id === currentFileId)
    if (currentFile) {
      setTasks(currentFile.tasks || [])
    }
  }, [files, currentFileId])

  // Filter tasks
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

  // Debounced search
  const debouncedSetSearchTerm = useCallback(
    _.debounce((value: string) => {
      setFilters((prev) => ({ ...prev, searchTerm: value }))
    }, 300),
    []
  )

  const handleCreateFirstFile = () => {
    if (!fileName.trim()) return

    const newFile: TaskFile = {
      id: generateId(),
      name: fileName.trim(),
      createdAt: getCurrentDateFormatted(),
      tasks: [],
    }

    setFiles([newFile])
    setCurrentFileId(newFile.id)
    setIsFirstTime(false)
    setFileName("")
    // Save to localStorage
    localStorage.setItem("taskFiles", JSON.stringify([newFile]))
  }

  const handleCreateFile = (fileName: string) => {
    const newFile: TaskFile = {
      id: generateId(),
      name: fileName,
      createdAt: getCurrentDateFormatted(),
      tasks: [],
    }

    const updatedFiles = [...files, newFile]
    setFiles(updatedFiles)
    setCurrentFileId(newFile.id)
    // Save to localStorage
    localStorage.setItem("taskFiles", JSON.stringify(updatedFiles))
  }

  const handleFileSelect = (fileId: string) => {
    setCurrentFileId(fileId)
  }

  const handleDeleteFile = (fileId: string) => {
    if (files.length <= 1) return

    const updatedFiles = files.filter((f) => f.id !== fileId)
    setFiles(updatedFiles)

    if (fileId === currentFileId && updatedFiles.length > 0) {
      setCurrentFileId(updatedFiles[0].id)
    }
    // Save to localStorage
    localStorage.setItem("taskFiles", JSON.stringify(updatedFiles))
  }

  const updateCurrentFile = (updatedTasks: Task[]) => {
    const updatedFiles = files.map((file) =>
      file.id === currentFileId ? { ...file, tasks: updatedTasks } : file
    )
    setFiles(updatedFiles)
    // Save to localStorage
    localStorage.setItem("taskFiles", JSON.stringify(updatedFiles))
  }

  const handleAddTask = (task: Task) => {
    const updatedTasks = [...tasks, task]
    setTasks(updatedTasks)
    updateCurrentFile(updatedTasks)
  }

  const handleUpdateTaskStatus = (id: string, status: Status) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            status,
            completionPercentage:
              status === "completed" ? 100 : task.completionPercentage,
            subtasks:
              status === "completed"
                ? task.subtasks.map((s) => ({ ...s, completed: true }))
                : task.subtasks,
          }
        : task
    )
    setTasks(updatedTasks)
    updateCurrentFile(updatedTasks)
  }

  const handleUpdateSubtask = (
    id: string,
    updatedSubtasks: Subtask[],
    completionPercentage: number
  ) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            subtasks: updatedSubtasks,
            completionPercentage,
            status: completionPercentage === 100 ? "completed" : task.status,
          }
        : task
    )
    setTasks(updatedTasks)
    updateCurrentFile(updatedTasks)
  }

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id)
    setTasks(updatedTasks)
    updateCurrentFile(updatedTasks)
  }

  const handleExportCSV = () => {
    try {
      const csvContent = taskToCSV(tasks)
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${currentFileId}_tasks.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting CSV:", error)
    }
  }

  const handleExportJSON = () => {
    try {
      const jsonContent = exportToJSON(tasks)
      const blob = new Blob([jsonContent], {
        type: "application/json;charset=utf-8;",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${currentFileId}_tasks.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting JSON:", error)
    }
  }

  // Prepare data for both BarChart and AreaChart
  const chartData = () => {
    const statuses: Status[] = ["todo", "preparing", "in-progress", "completed"]
    const priorities: Priority[] = ["normal", "tomorrow", "urgent"]

    // Create data objects for each status
    const data = statuses.map((status) => {
      const tasksInStatus = filteredTasks.filter(
        (task) => task.status === status
      )
      return {
        status: getStatusLabel(status), // Display-friendly status label
        normal: tasksInStatus.filter((task) => task.priority === "normal")
          .length,
        tomorrow: tasksInStatus.filter((task) => task.priority === "tomorrow")
          .length,
        urgent: tasksInStatus.filter((task) => task.priority === "urgent")
          .length,
      }
    })

    return data
  }

  // Chart configuration for styling
  const chartConfig = {
    normal: {
      label: getPriorityLabel("normal"),
      color: "#3b82f6", // Blue for normal
    },
    tomorrow: {
      label: getPriorityLabel("tomorrow"),
      color: "#eab308", // Yellow for tomorrow
    },
    urgent: {
      label: getPriorityLabel("urgent"),
      color: "#ef4444", // Red for urgent
    },
  }

  if (isFirstTime) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Chào mừng bạn đến với Quản lý công việc</CardTitle>
            <CardDescription>
              Vui lòng tạo file công việc đầu tiên của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Label htmlFor="first-file-name">Tên file đầu tiên</Label>
              <div className="flex gap-2">
                <Input
                  id="first-file-name"
                  placeholder="Nhập tên file"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
                <Button
                  onClick={handleCreateFirstFile}
                  disabled={!fileName.trim()}
                >
                  Tạo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý công việc</h1>
        <div className="flex gap-2">
          <NewFileDialog
            isOpen={isNewFileDialogOpen}
            onOpenChange={setIsNewFileDialogOpen}
            onCreateFile={handleCreateFile}
          />
          <FileSelect
            files={files}
            currentFile={currentFileId}
            onFileSelect={handleFileSelect}
            onDeleteFile={handleDeleteFile}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Tìm kiếm công việc..."
              className="pl-8"
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            />
          </div>
          <NewTaskDialog
            isOpen={isNewTaskDialogOpen}
            onOpenChange={setIsNewTaskDialogOpen}
            onAddTask={handleAddTask}
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Select
            value={filters.priority}
            onValueChange={(value: Priority | "all") =>
              setFilters((prev) => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả ưu tiên</SelectItem>
              <SelectItem value="normal">Cần làm</SelectItem>
              <SelectItem value="tomorrow">Cần làm vào ngày mai</SelectItem>
              <SelectItem value="urgent">Cần gấp</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value: Status | "all") =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="w-40">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Xuất dữ liệu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV}>
                Xuất CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                Xuất JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-[200px] grid-cols-2 mb-4">
          <TabsTrigger value="list">Danh sách</TabsTrigger>
          <TabsTrigger value="board">Bảng</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê công việc (Bar Chart)</CardTitle>
                <CardDescription>
                  Biểu đồ cột hiển thị số lượng công việc theo trạng thái và ưu
                  tiên
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px]">
                  <BarChart
                    data={chartData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="status"
                      tick={{ fill: "#333" }}
                      label={{
                        position: "insideBottom",
                        offset: -5,
                        fill: "#333",
                      }}
                    />
                    <YAxis
                      tick={{ fill: "#333" }}
                      label={{
                        value: "Số lượng công việc",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#333",
                      }}
                      tickCount={5}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ color: "#333" }} />
                    <Bar
                      dataKey="normal"
                      stackId="a"
                      fill={chartConfig.normal.color}
                    />
                    <Bar
                      dataKey="tomorrow"
                      stackId="a"
                      fill={chartConfig.tomorrow.color}
                    />
                    <Bar
                      dataKey="urgent"
                      stackId="a"
                      fill={chartConfig.urgent.color}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thống kê công việc (Area Chart)</CardTitle>
                <CardDescription>
                  Biểu đồ khu vực hiển thị số lượng công việc theo trạng thái và
                  ưu tiên
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px]">
                  <AreaChart
                    data={chartData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="fillNormal"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartConfig.normal.color}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartConfig.normal.color}
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                      <linearGradient
                        id="fillTomorrow"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartConfig.tomorrow.color}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartConfig.tomorrow.color}
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                      <linearGradient
                        id="fillUrgent"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartConfig.urgent.color}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartConfig.urgent.color}
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="status"
                      tick={{ fill: "#333" }}
                      label={{
                        position: "insideBottom",
                        offset: -5,
                        fill: "#333",
                      }}
                    />
                    <YAxis
                      tick={{ fill: "#333" }}
                      label={{
                        value: "Số lượng công việc",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#333",
                      }}
                      tickCount={5}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ color: "#333" }} />
                    <Area
                      type="monotone"
                      dataKey="normal"
                      stackId="a"
                      stroke={chartConfig.normal.color}
                      fill="url(#fillNormal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="tomorrow"
                      stackId="a"
                      stroke={chartConfig.tomorrow.color}
                      fill="url(#fillTomorrow)"
                    />
                    <Area
                      type="monotone"
                      dataKey="urgent"
                      stackId="a"
                      stroke={chartConfig.urgent.color}
                      fill="url(#fillUrgent)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(
              ["todo", "preparing", "in-progress", "completed"] as Status[]
            ).map((status) => (
              <div key={status} className="space-y-4">
                <Badge>
                  <h3 className="font-semibold text-lg capitalize">
                    {getStatusLabel(status)}
                  </h3>
                </Badge>
                <div className="space-y-4">
                  {filteredTasks
                    .filter((task) => task.status === status)
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onDelete={handleDeleteTask}
                        onUpdateSubtask={handleUpdateSubtask}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
