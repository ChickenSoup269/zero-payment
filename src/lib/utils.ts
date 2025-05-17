/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Expense, TimeFrame, UserData } from "./types"
import { EXPENSE_CATEGORIES } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: "VND" | "USD" = "VND"
): string {
  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  const [day, month, year] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export function getCurrentDateFormatted(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const year = String(now.getFullYear()).slice(2)
  return `${day}-${month}-${year}`
}

export function getCategoryFromSubcategory(subcategory: string): string {
  for (const [category, subcategories] of Object.entries(EXPENSE_CATEGORIES)) {
    if (subcategories.includes(subcategory)) {
      return category
    }
  }
  return "Chi khác"
}

export function getStartOfTimeFrame(timeFrame: TimeFrame): Date {
  const now = new Date()
  switch (timeFrame) {
    case "week":
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      return new Date(now.setDate(diff))
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case "year":
      return new Date(now.getFullYear(), 0, 1)
    case "all":
    default:
      return new Date(0)
  }
}

export function filterExpensesByTimeFrame(
  expenses: Expense[],
  timeFrame: TimeFrame
): Expense[] {
  const startDate = getStartOfTimeFrame(timeFrame)
  return expenses.filter((expense) => new Date(expense.timestamp) >= startDate)
}

export function groupExpensesByCategory(
  expenses: Expense[]
): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const category = expense.category
    acc[category] = (acc[category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
}

export function groupExpensesBySubcategory(
  expenses: Expense[]
): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const subcategory = expense.subcategory
    acc[subcategory] = (acc[subcategory] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
}

export function groupExpensesByDate(
  expenses: Expense[],
  timeFrame: TimeFrame
): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const date = expense.date
    let key = date
    if (timeFrame === "year") {
      const [day, month, year] = date.split("-")
      key = `${month}-${year}`
    }
    acc[key] = (acc[key] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
}

export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0)
}

export function generateUniqueId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

export function saveUserData(userData: UserData): void {
  if (typeof window !== "undefined") {
    const updatedUserData = {
      ...userData,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem("userData", JSON.stringify(updatedUserData))
  }
}

export function loadUserData(): UserData | null {
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem("userData")
    return userData ? JSON.parse(userData) : null
  }
  return null
}

export function downloadJsonFile(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsText(file)
  })
}

export function isValidUserData(data: any): boolean {
  return (
    data &&
    typeof data === "object" &&
    typeof data.name === "string" &&
    Array.isArray(data.expenses) &&
    typeof data.created === "string" &&
    typeof data.lastUpdated === "string"
  )
}
