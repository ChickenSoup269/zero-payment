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

export type TimeFrame = "week" | "month" | "year" | "all"
export type ChartType = "bar" | "pie" | "line"
