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
        <div className="flex min-h-screen bg-background">
          <AdminSidebar />
          <main className="flex-1 lg:ml-72 transition-all duration-300">
            <div className="p-4 pt-16 lg:pt-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
