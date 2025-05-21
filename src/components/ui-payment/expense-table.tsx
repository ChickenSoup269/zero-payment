/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  RowSelectionState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Expense } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Trash2,
  ArrowUpDown,
  //Save,
  FileJson,
  FileType,
  File,
  CheckSquare,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from "@/lib/constants"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { saveAs } from "file-saver"

interface ExpenseTableProps {
  expenses: Expense[]
  onDeleteExpense: (id: string) => void
}

export function ExpenseTable({ expenses, onDeleteExpense }: ExpenseTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ])
  const [searchFilter, setSearchFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [categoryFilter, setCategoryFilter] = React.useState<string[]>([])

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || "#888888"
  }

  const columns: ColumnDef<Expense>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      ),
      cell: ({ row }) => (
        <div className="px-1">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Chọn dòng"
          />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center"
          >
            Ngày
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const value = row.getValue("date") as string
        return <div className="font-medium">{formatDate(value)}</div>
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => {
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="flex items-center"
            >
              Danh mục
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Lọc danh mục</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(EXPENSE_CATEGORIES).map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={categoryFilter.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCategoryFilter([...categoryFilter, category])
                      } else {
                        setCategoryFilter(
                          categoryFilter.filter((c) => c !== category)
                        )
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      />
                      <span>{category}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      cell: ({ row }) => {
        const category = row.getValue("category") as string
        return (
          <Badge
            className="font-normal"
            style={{
              backgroundColor: getCategoryColor(category),
              color: "white",
            }}
          >
            {category}
          </Badge>
        )
      },
      filterFn: (row, id, filterValue) => {
        if (filterValue.length === 0) return true
        return filterValue.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "subcategory",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center"
          >
            Chi tiết
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center"
          >
            Mô tả
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center"
          >
            Số tiền
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number
        return (
          <div className="font-medium text-right">{formatCurrency(amount)}</div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteExpense(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )
      },
    },
  ]

  // Apply categoryFilter to column filters
  React.useEffect(() => {
    if (categoryFilter.length > 0) {
      setColumnFilters([
        ...columnFilters.filter((filter) => filter.id !== "category"),
        {
          id: "category",
          value: categoryFilter,
        },
      ])
    } else {
      setColumnFilters(
        columnFilters.filter((filter) => filter.id !== "category")
      )
    }
  }, [categoryFilter])

  // Filter by search term
  const filteredData = searchFilter
    ? expenses.filter((expense) => {
        const searchValue = searchFilter.toLowerCase()
        return (
          expense.category.toLowerCase().includes(searchValue) ||
          expense.subcategory.toLowerCase().includes(searchValue) ||
          expense.description.toLowerCase().includes(searchValue) ||
          expense.date.includes(searchValue)
        )
      })
    : expenses

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      rowSelection,
      columnFilters,
    },
  })

  // Export functions
  const getSelectedRows = () => {
    return table
      .getFilteredRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original)
  }

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
    })

    doc.setFont("Arial Unicode MS", "normal") // Hoặc "tahoma", "times"

    const selectedRows =
      Object.keys(rowSelection).length > 0 ? getSelectedRows() : filteredData

    const tableColumn = ["Ngày", "Danh mục", "Chi tiết", "Mô tả", "Số tiền"]
    const tableRows = selectedRows.map((expense) => [
      formatDate(expense.date),
      expense.category,
      expense.subcategory,
      expense.description,
      formatCurrency(expense.amount),
    ])

    // Thêm cấu hình font vào autoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      styles: {
        font: "Arial Unicode MS", // ⚠️ Phải trùng với font đã set
        fontSize: 8,
        textColor: [0, 0, 0], // Màu đen
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
    })

    doc.save("quan-ly-chi-tieu.pdf")
  }

  const exportToJSON = () => {
    const selectedRows =
      Object.keys(rowSelection).length > 0 ? getSelectedRows() : filteredData

    const jsonStr = JSON.stringify(selectedRows, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" })
    saveAs(blob, "quan-ly-chi-tieu.json")
  }

  const exportToText = () => {
    const selectedRows =
      Object.keys(rowSelection).length > 0 ? getSelectedRows() : filteredData

    let content = "BÁO CÁO CHI TIÊU\n\n"
    selectedRows.forEach((expense) => {
      content += `Ngày: ${formatDate(expense.date)}\n`
      content += `Danh mục: ${expense.category}\n`
      content += `Chi tiết: ${expense.subcategory}\n`
      content += `Mô tả: ${expense.description}\n`
      content += `Số tiền: ${formatCurrency(expense.amount)}\n`
      content += "-------------------------------------------\n"
    })

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    saveAs(blob, "quan-ly-chi-tieu.txt")
  }

  return (
    <div>
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center">
          <Input
            placeholder="Tìm kiếm..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={expenses.length === 0}
          >
            <File className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToText}
            disabled={expenses.length === 0}
          >
            <FileType className="mr-2 h-4 w-4" />
            TXT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToJSON}
            disabled={expenses.length === 0}
          >
            <FileJson className="mr-2 h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      {Object.keys(rowSelection).length > 0 && (
        <div className="bg-muted rounded-md p-2 mb-2 flex justify-between items-center">
          <span>Đã chọn {Object.keys(rowSelection).length} mục</span>
          <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
            Bỏ chọn
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`${row.getIsSelected() ? "bg-muted/50" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Hiển thị {table.getRowModel().rows.length} / {filteredData.length}{" "}
          dòng
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}
