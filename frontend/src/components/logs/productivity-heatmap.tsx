"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface DailyLog {
  logDate: string
  timeSpent: Array<{
    hours: number
    minutes: number
  }>
  mood: string
}

export function ProductivityHeatmap() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const { toast } = useToast()
  const router = useRouter()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          router.push("/login")
          return
        }

        const response = await fetch(`${backendUrl}/dailylogs`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          router.push("/login")
          return
        }

        if (!response.ok) throw new Error("Failed to fetch logs")
        const data = await response.json()
        setLogs(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load productivity data",
        })
      }
    }

    fetchLogs()
  }, [toast, router])

  const getTotalHoursForDate = (date: string) => {
    const log = logs.find((l) => l.logDate.split("T")[0] === date)
    if (!log) return 0
    return log.timeSpent.reduce((sum, task) => sum + (task.hours + task.minutes / 60), 0)
  }

  // Helper to get all days in a given month, padded and split into weeks
  const getMonthWeeks = (year: number, month: number) => {
    const days: string[] = []
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const date = new Date(year, month, d)
      days.push(date.toISOString().split("T")[0])
    }
    // Pad the start so the first day of the first week is always Sunday
    const padStart = firstDayOfMonth.getDay()
    for (let i = 0; i < padStart; i++) {
      days.unshift("")
    }
    // Split into weeks (7 days per week)
    const weeks: string[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }
    return weeks
  }

  // Get current and previous month info
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const prevYear = prevMonthDate.getFullYear()
  const prevMonth = prevMonthDate.getMonth()

  const currentMonthWeeks = getMonthWeeks(currentYear, currentMonth)
  const prevMonthWeeks = getMonthWeeks(prevYear, prevMonth)

  const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })
  const prevMonthLabel = prevMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const getColorIntensity = (hours: number) => {
    if (hours === 0) return "bg-[#ebedf0]"
    if (hours < 2) return "bg-[#9be9a8]"
    if (hours < 4) return "bg-[#40c463]"
    if (hours < 6) return "bg-[#30a14e]"
    return "bg-[#216e39]"
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Productivity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 justify-center">
           {/* Weekday labels */}
           <div className="flex flex-col justify-start pt-5 space-y-[2px] text-[10px] text-muted-foreground h-[84px]">
            <span>Mon</span>
            <span className="invisible">Tue</span>
            <span>Wed</span>
            <span className="invisible">Thu</span>
            <span>Fri</span>
            <span className="invisible">Sat</span>
            <span className="invisible">Sun</span>
          </div>
          {/* Heatmap grids */}
          <div className="flex gap-4 overflow-x-auto pb-2">
             {/* Previous Month Heatmap */}
            <div className="flex flex-col items-start flex-shrink-0">
              <span className="text-xs text-muted-foreground mb-1 ml-1">{prevMonthLabel}</span>
              <div
                className="grid grid-rows-7 gap-[2px]"
                style={{ gridTemplateColumns: `repeat(${prevMonthWeeks.length}, 1fr)` }}
              >
                {prevMonthWeeks.map((week, colIdx) =>
                  week.map((date, rowIdx) => {
                    if (!date) {
                      return <div key={`prev-empty-${colIdx}-${rowIdx}`} className="h-3 w-3 rounded-sm bg-transparent" />
                    }
                    const hours = getTotalHoursForDate(date)
                    return (
                      <div
                        key={`prev-${date}`}
                        className={`h-3 w-3 ${getColorIntensity(hours)} rounded-sm`}
                        title={`${date}: ${hours.toFixed(1)} hours`}
                      />
                    )
                  })
                )}
              </div>
            </div>
            {/* Current Month Heatmap */}
            <div className="flex flex-col items-start flex-shrink-0">
              <span className="text-xs text-muted-foreground mb-1 ml-1">{currentMonthLabel}</span>
              <div
                className="grid grid-rows-7 gap-[2px]"
                 style={{ gridTemplateColumns: `repeat(${currentMonthWeeks.length}, 1fr)` }}
              >
                 {/* Render by column (week), then by row (day of week) */}
                {currentMonthWeeks.map((week, colIdx) =>
                  week.map((date, rowIdx) => {
                    if (!date) {
                      return <div key={`curr-empty-${colIdx}-${rowIdx}`} className="h-3 w-3 rounded-sm bg-transparent" />
                    }
                    const hours = getTotalHoursForDate(date)
                    return (
                      <div
                        key={`curr-${date}`}
                        className={`h-3 w-3 ${getColorIntensity(hours)} rounded-sm`}
                        title={`${date}: ${hours.toFixed(1)} hours`}
                      />
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end space-x-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-[#ebedf0]" />
            <div className="h-3 w-3 rounded-sm bg-[#9be9a8]" />
            <div className="h-3 w-3 rounded-sm bg-[#40c463]" />
            <div className="h-3 w-3 rounded-sm bg-[#30a14e]" />
            <div className="h-3 w-3 rounded-sm bg-[#216e39]" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
} 