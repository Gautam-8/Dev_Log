import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="font-bold">
            DevLog
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <main>
        {children}
      </main>
    </div>
  )
} 