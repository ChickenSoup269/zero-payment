"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FirstTimeModalProps {
  open: boolean
  onSave: (name: string) => void
}

export function FirstTimeModal({ open, onSave }: FirstTimeModalProps) {
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState("")

  const handleSave = () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên của bạn")
      return
    }

    onSave(name)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Chào mừng bạn đến với ứng dụng Quản lý Chi tiêu
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Tên của bạn</Label>
            <Input
              id="name"
              placeholder="Nhập tên của bạn"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <p className="text-sm text-muted-foreground">
            Dữ liệu của bạn sẽ được lưu trữ trên trình duyệt của bạn. Bạn có thể
            xuất và nhập dữ liệu để sao lưu hoặc chuyển sang thiết bị khác.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Bắt đầu sử dụng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
