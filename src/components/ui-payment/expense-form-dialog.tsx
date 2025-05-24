"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus } from "lucide-react"
import { ExpenseForm } from "./expense-form"
import { Button } from "@/components/ui/button"
import { Expense } from "@/lib/types"

type ExpenseFormDialogProps = {
  onAddExpense: (expense: Expense) => void
}

export function ExpenseFormDialog({ onAddExpense }: ExpenseFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleAddExpense = (expense: Expense) => {
    onAddExpense(expense)
    setIsOpen(false)
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
        size="sm"
      >
        <Plus className="w-5 h-5" />
        Thêm chi tiêu mới
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Dialog container - centered */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Dialog content */}
              <motion.div
                className="bg-background rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()} // Prevent clicks from closing the dialog
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Thêm chi tiêu mới</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <ExpenseForm onAddExpense={handleAddExpense} />
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
