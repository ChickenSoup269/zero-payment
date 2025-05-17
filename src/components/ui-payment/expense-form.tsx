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
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  DESCRIPTION_SUGGESTIONS,
} from "@/lib/constants"
import {
  getCurrentDateFormatted,
  getCategoryFromSubcategory,
  generateUniqueId,
} from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  const selectedSubcategory = form.watch("subcategory")
  const subcategories = selectedCategory
    ? EXPENSE_CATEGORIES[selectedCategory] || []
    : []

  // Lấy gợi ý mô tả dựa trên danh mục và danh mục con đã chọn
  const descriptionSuggestions = React.useMemo(() => {
    if (selectedCategory && selectedSubcategory) {
      return (
        DESCRIPTION_SUGGESTIONS[selectedCategory]?.[selectedSubcategory] || []
      )
    }
    return []
  }, [selectedCategory, selectedSubcategory])

  // Theo dõi trạng thái hiển thị popover gợi ý
  const [showSuggestions, setShowSuggestions] = React.useState(false)

  // Theo dõi focus của textarea
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Reset subcategory when category changes
  React.useEffect(() => {
    if (selectedCategory) {
      form.setValue("subcategory", "")
    }
  }, [selectedCategory, form])

  // Xử lý sự kiện phím Tab để hiển thị gợi ý
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && descriptionSuggestions.length > 0) {
      e.preventDefault() // Ngăn không cho tab chuyển focus
      setShowSuggestions(true)
    }
  }

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
                        // Hiển thị gợi ý nhỏ khi focus
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
                                // Focus lại vào textarea sau khi chọn gợi ý
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
