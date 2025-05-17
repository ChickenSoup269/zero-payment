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
import { Trash2 } from "lucide-react"

interface ExpenseTableProps {
  expenses: Expense[]
  onDeleteExpense: (id: string) => void
}

export function ExpenseTable({ expenses, onDeleteExpense }: ExpenseTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ])
  const [filtering, setFiltering] = React.useState("")

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: "Ngày",
      cell: ({ row }) => formatDate(row.getValue("date")),
    },
    {
      accessorKey: "category",
      header: "Danh mục",
    },
    {
      accessorKey: "subcategory",
      header: "Chi tiết",
    },
    {
      accessorKey: "description",
      header: "Mô tả",
    },
    {
      accessorKey: "amount",
      header: "Số tiền",
      cell: ({ row }) => formatCurrency(row.getValue("amount")),
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

  const filteredData = filtering
    ? expenses.filter((expense) => {
        const searchValue = filtering.toLowerCase()
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
    state: {
      sorting,
    },
  })

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Tìm kiếm..."
          value={filtering}
          onChange={(e) => setFiltering(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
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
      <div className="flex items-center justify-end space-x-2 py-4">
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
  )
}
