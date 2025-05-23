/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserData } from "@/lib/types"
import { downloadJsonFile, readJsonFile, isValidUserData } from "@/lib/utils"
import { FileUp, FileDown, FileJson } from "lucide-react"

interface FileImportExportProps {
  onImport: (data: UserData) => void
  onExport: () => UserData
}

export function FileImportExport({
  onImport,
  onExport,
}: FileImportExportProps) {
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = onExport()
    downloadJsonFile(data, `${data.name || "expense"}-data.json`)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/json") {
        setError("Vui lòng chọn file JSON")
        return
      }
      setSelectedFile(file)
      setError("")
    }
  }

  const handleFileImport = async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn file để nhập")
    }

    try {
      const data = await readJsonFile(selectedFile)

      if (!isValidUserData(data)) {
        setError("File không hợp lệ. Vui lòng chọn file JSON đúng định dạng")
        return
      }

      onImport(data)
      setImportModalOpen(false)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      setError("Có lỗi xảy ra khi đọc file. Vui lòng thử lại")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FileJson className="mr-2 h-4 w-4" />
            Quản lý dữ liệu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setImportModalOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Nhập file
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Xuất file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nhập dữ liệu từ file</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100"
            />
            {selectedFile && (
              <p className="text-sm">File đã chọn: {selectedFile.name}</p>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground">
              Lưu ý: Nhập file sẽ thay thế toàn bộ dữ liệu hiện tại. Hãy đảm bảo
              bạn đã xuất dữ liệu hiện tại để sao lưu.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleFileImport}>Nhập</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
