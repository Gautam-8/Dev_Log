"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DailyLogForm } from "@/components/logs/daily-log-form"
import { LogsList, LogsListRef } from "@/components/logs/logs-list"
import { ProductivityHeatmap } from "@/components/logs/productivity-heatmap"

interface Stats {
  totalLogs: number
  averageMood: string
  totalHours: number
}

interface DailyLog {
  logDate: string
  timeSpent: Array<{
    hours: number
    minutes: number
  }>
  mood: string
}

export default function DeveloperDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalLogs: 0,
    averageMood: "😐",
    totalHours: 0,
  })
  const { toast } = useToast()
  const router = useRouter()
  const logsListRef = useRef<LogsListRef | null>(null)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchStats = async () => {
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

        if (!response.ok) throw new Error("Failed to fetch stats")
        const logs = await response.json() as DailyLog[]

        // Calculate stats for the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const recentLogs = logs.filter((log) => 
          new Date(log.logDate) >= thirtyDaysAgo
        )

        const totalHours = recentLogs.reduce((sum, log) => {
          return sum + log.timeSpent.reduce((taskSum, task) => 
            taskSum + (task.hours + task.minutes / 60), 0
          )
        }, 0)

        const moodCounts = recentLogs.reduce((acc: Record<string, number>, log) => {
          acc[log.mood] = (acc[log.mood] || 0) + 1
          return acc
        }, {})

        const averageMood = Object.entries(moodCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || "😐"

        setStats({
          totalLogs: recentLogs.length,
          averageMood,
          totalHours: Math.round(totalHours * 10) / 10,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load stats",
        })
      }
    }

    fetchStats()
  }, [toast, router])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Daily Log Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Daily Log</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyLogForm 
              mode="create" 
              onComplete={() => {}} 
              logsListRef={logsListRef}
            />
          </CardContent>
        </Card>

        {/* Right: Heatmap and Previous Logs */}
        <div className="flex flex-col gap-6">
          <ProductivityHeatmap />
          <LogsList ref={logsListRef} />
        </div>
      </div>
    </div>
  )
} 