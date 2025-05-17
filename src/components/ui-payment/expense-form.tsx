"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { EXPENSE_CATEGORIES } from "@/lib/constants"
import {
  getCurrentDateFormatted,
  //getCategoryFromSubcategory,
  generateUniqueId,
} from "@/lib/utils"

const formSchema = z.object({
  amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
  category: z.string().min(1, "Vui lòng chọn danh mục"),
  subcategory: z.string().min(1, "Vui lòng chọn loại chi tiêu"),
  description: z.string().optional(),
  date: z.string().min(1, "Vui lòng nhập ngày"),
})

type ExpenseFormProps = {
  onAddExpense: (expense: Expense) => void
}

export function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      category: "",
      subcategory: "",
      description: "",
      date: getCurrentDateFormatted(),
    },
  })

  const selectedCategory = form.watch("category")
  const subcategories = selectedCategory
    ? EXPENSE_CATEGORIES[selectedCategory] || []
    : []

  // Reset subcategory when category changes
  React.useEffect(() => {
    if (selectedCategory) {
      form.setValue("subcategory", "")
    }
  }, [selectedCategory, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const expense: Expense = {
      id: generateUniqueId(),
      amount: values.amount,
      category: values.category,
      subcategory: values.subcategory,
      description: values.description || "",
      date: values.date,
      timestamp: new Date().getTime(),
    }

    onAddExpense(expense)
    form.reset({
      amount: 0,
      category: "",
      subcategory: "",
      description: "",
      date: getCurrentDateFormatted(),
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
                <Input type="number" placeholder="100000" {...field} />
              </FormControl>
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
              <FormControl>
                <Textarea placeholder="Nhập mô tả chi tiết" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày chi tiêu</FormLabel>
              <FormControl>
                <Input placeholder="DD-MM-YY" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Thêm chi tiêu
        </Button>
      </form>
    </Form>
  )
}
