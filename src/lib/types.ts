// src/lib/types.ts
export interface Expense {
  id: string
  amount: number
  category: string
  subcategory: string
  description: string
  date: string // format: DD-MM-YYYY
  timestamp: number
}

export interface UserData {
  name: string
  expenses: Expense[]
  created: string
  lastUpdated: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  createdAt: string
  dueDate?: string
}

export interface TaskFilters {
  priority: Priority | "all"
  status: Status | "all"
  searchTerm: string
}

export type Priority = "tomorrow" | "normal" | "urgent"
export type Status = "todo" | "in-progress" | "preparing" | "completed"
export type TimeFrame = "week" | "month" | "year" | "all"
export type ChartType = "bar" | "pie" | "line"
