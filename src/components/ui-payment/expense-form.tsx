"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Expense } from "@/lib/types"
import { EXPENSE_CATEGORIES, DESCRIPTION_SUGGESTIONS } from "@/lib/constants"
import { generateUniqueId } from "@/lib/utils" // Xóa getCurrentDateFormatted nếu không cần
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Clock } from "lucide-react"
import { format, parse } from "date-fns"
import { vi } from "date-fns/locale"

// Hàm đọc số tiền thành chữ (giữ nguyên)
const unitText = [
  "",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
]
const scaleTexts = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ", "tỷ tỷ"]

function readThreeDigits(number: number, hasScale = false): string {
  const hundreds = Math.floor(number / 100)
  const remainder = number % 100
  const tens = Math.floor(remainder / 10)
  const units = remainder % 10

  let result = ""
  if (hundreds > 0) {
    result += unitText[hundreds] + " trăm "
  } else if (hasScale && (tens > 0 || units > 0)) {
    result += "không trăm "
  }

  if (tens > 1) {
    result += unitText[tens] + " mươi "
  } else if (tens === 1) {
    result += "mười "
  } else if (hasScale && units > 0 && hundreds > 0) {
    result += "lẻ "
  }

  if (tens > 1 && units === 1) {
    result += "mốt"
  } else if (tens > 0 && units === 5) {
    result += "lăm"
  } else if (units > 0) {
    result += unitText[units]
  }

  return result.trim()
}

const formatCurrency = (value: string): string => {
  const numericValue = value.replace(/\D/g, "")
  return numericValue === "" ? "" : Number(numericValue).toLocaleString("vi-VN")
}

function readNumber(number: number): string {
  let result = ""
  let index = 0
  let absNumber = Math.abs(number)
  const numberStr = String(absNumber)
  const lastIndex = Math.floor(numberStr.length / 3)

  if (!absNumber) return "Không đồng"

  do {
    const hasScale = index !== lastIndex || Math.floor(absNumber / 1000) > 0
    const threeDigits = readThreeDigits(absNumber % 1000, hasScale)
    if (threeDigits) {
      result = `${threeDigits} ${scaleTexts[index]} ${result}`
    }
    absNumber = Math.floor(absNumber / 1000)
    index++
  } while (absNumber > 0)

  result = (number < 0 ? "âm " : "") + result.trim() + " đồng"
  return result[0].toUpperCase() + result.slice(1)
}

const formSchema = z.object({
  amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
  category: z.string().min(1, "Vui lòng chọn danh mục"),
  subcategory: z.string().min(1, "Vui lòng chọn loại chi tiêu"),
  description: z.string().optional(),
  date: z.string().min(1, "Vui lòng nhập ngày"),
  time: z.string().optional(),
})

type ExpenseFormProps = {
  onAddExpense: (expense: Expense) => void
}

export function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: (data) => {
      try {
        return { values: formSchema.parse(data), errors: {} }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formattedErrors = error.errors.reduce((acc, err) => {
            const path = err.path.join(".")
            return {
              ...acc,
              [path]: { message: err.message, type: "validation" },
            }
          }, {})
          return { values: {}, errors: formattedErrors }
        }
        return {
          values: {},
          errors: { root: { message: "Validation failed", type: "root" } },
        }
      }
    },
    defaultValues: {
      amount: 0,
      category: "",
      subcategory: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"), // Ngày hiện tại
      time: format(new Date(), "HH:mm"),
    },
  })

  type ExpenseCategoryKey = keyof typeof EXPENSE_CATEGORIES
  const selectedCategory = form.watch("category")
  const selectedSubcategory = form.watch("subcategory")
  const amount = form.watch("amount")
  const subcategories =
    selectedCategory &&
    (Object.keys(EXPENSE_CATEGORIES) as string[]).includes(selectedCategory)
      ? EXPENSE_CATEGORIES[selectedCategory as ExpenseCategoryKey] || []
      : []

  const descriptionSuggestions = React.useMemo(() => {
    if (selectedCategory && selectedSubcategory) {
      return (
        DESCRIPTION_SUGGESTIONS[selectedCategory]?.[selectedSubcategory] || []
      )
    }
    return []
  }, [selectedCategory, selectedSubcategory])

  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (selectedCategory) {
      form.setValue("subcategory", "")
    }
  }, [selectedCategory, form])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && descriptionSuggestions.length > 0) {
      e.preventDefault()
      setShowSuggestions(true)
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const dateTimeStr = `${values.date}T${values.time || "00:00"}`
    const timestamp = parse(
      dateTimeStr,
      "yyyy-MM-dd'T'HH:mm",
      new Date()
    ).getTime()

    const expense: Expense = {
      id: generateUniqueId(),
      amount: values.amount,
      category: values.category,
      subcategory: values.subcategory,
      description: values.description || "",
      date: values.date,
      time: values.time || format(new Date(), "HH:mm"),
      timestamp: timestamp,
    }

    console.log("New expense:", expense)
    onAddExpense(expense)
    form.reset({
      amount: 0,
      category: "",
      subcategory: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"), // Reset về ngày hiện tại
      time: format(new Date(), "HH:mm"),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số tiền (VND)</FormLabel>
              <FormControl>
                <Input
                  placeholder="0"
                  value={
                    field.value ? formatCurrency(field.value.toString()) : ""
                  }
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value)
                    e.target.value = formatted
                    field.onChange(
                      formatted ? parseInt(formatted.replace(/\./g, ""), 10) : 0
                    )
                  }}
                />
              </FormControl>
              {amount > 0 && (
                <div className="text-sm text-muted-foreground mt-1">
                  {readNumber(amount)}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Danh mục chính</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục chính" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.keys(EXPENSE_CATEGORIES).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subcategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Danh mục chi tiết</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedCategory}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedCategory
                          ? "Chọn danh mục chi tiết"
                          : "Hãy chọn danh mục chính trước"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả (tùy chọn)</FormLabel>
              <div className="relative">
                <FormControl>
                  <Textarea
                    placeholder={
                      descriptionSuggestions.length > 0
                        ? "Nhấn Tab để xem gợi ý mô tả"
                        : "Nhập mô tả chi tiết"
                    }
                    {...field}
                    ref={textareaRef}
                    className="pr-20"
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (descriptionSuggestions.length > 0) {
                        setShowSuggestions(false)
                      }
                    }}
                  />
                </FormControl>

                {descriptionSuggestions.length > 0 && (
                  <Popover
                    open={showSuggestions}
                    onOpenChange={setShowSuggestions}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 px-2 text-xs text-muted-foreground"
                        onClick={() => setShowSuggestions(true)}
                      >
                        Gợi ý
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" align="end">
                      <div className="space-y-2">
                        <h4 className="font-medium">Gợi ý mô tả</h4>
                        <div className="flex flex-col space-y-1 max-h-60 overflow-y-auto">
                          {descriptionSuggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              className="justify-start h-auto py-1 px-2 text-sm text-left"
                              onClick={() => {
                                form.setValue("description", suggestion)
                                setShowSuggestions(false)
                                setTimeout(
                                  () => textareaRef.current?.focus(),
                                  100
                                )
                              }}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ngày</FormLabel>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal flex justify-between items-center"
                      >
                        {field.value
                          ? format(new Date(field.value), "dd/MM/yyyy")
                          : "Chọn ngày"}
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"))
                          setCalendarOpen(false)
                        }
                      }}
                      locale={vi}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thời gian</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type="time" {...field} className="pl-10" />
                  </FormControl>
                  <Clock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full mt-6">
          Lưu chi tiêu
        </Button>
      </form>
    </Form>
  )
}
