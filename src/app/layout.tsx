import "./globals.css"
import { Inter } from "next/font/google"
import AdminSidebar from "@/components/ui-sidebar/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Expense Management",
  description: "Manage your expenses efficiently",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 p-6 ml-16 lg:ml-64">{children}</main>
        </div>
      </body>
    </html>
  )
}
