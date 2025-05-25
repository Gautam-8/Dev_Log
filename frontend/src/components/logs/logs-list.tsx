"use client"

import { useEffect, useState, forwardRef, useImperativeHandle, type Ref } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DailyLogForm } from "./daily-log-form"

interface DailyLog {
  id: string
  logDate: string
  tasks: string
  timeSpent: Array<{
    taskId: string
    hours: number
    minutes: number
  }>
  mood: string
  blockers?: string
  isReviewed?: boolean
  reviewComment?: string
}

export interface LogsListRef {
  refresh: () => Promise<void>;
}

const MOOD_DISPLAY = {
  'GREAT': '😊 Great',
  'GOOD': '🙂 Good',
  'NEUTRAL': '😐 Neutral',
  'NOT_GREAT': '🙁 Not Great',
  'BAD': '😢 Bad',
} as const;

interface LogsListProps {}

export const LogsList = forwardRef<LogsListRef | null, LogsListProps>((props, ref) => {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;


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
        description: "Failed to load logs",
      })
    }
  }

  useImperativeHandle(ref, () => ({
    refresh: fetchLogs,
  }));

  useEffect(() => {
    fetchLogs()
  }, [toast, router])

  const handleEdit = (log: DailyLog) => {
    setSelectedLog(log)
    setIsEditDialogOpen(true)
  }

  const handleEditComplete = () => {
    setIsEditDialogOpen(false)
    setSelectedLog(null)
    fetchLogs() // Refresh the list
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previous Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[350px] overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {new Date(log.logDate).toLocaleDateString()}
                </p>
                <div className="text-sm text-muted-foreground">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: log.tasks }}
                  ></div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>
                    {log.timeSpent.reduce(
                      (sum, task) => sum + (task.hours + task.minutes / 60),
                      0
                    ).toFixed(1)}{" "}
                    hours
                  </span>
                  <span>•</span>
                  <span>{MOOD_DISPLAY[log.mood as keyof typeof MOOD_DISPLAY]}</span>
                </div>
                {log.blockers && (
                  <p className="text-sm text-red-500">Blockers: {log.blockers}</p>
                )}
                {log.isReviewed && (
                  <div className="text-sm mt-2">
                    <p className="font-medium text-green-600">Reviewed by Manager</p>
                    {log.reviewComment && (
                      <p className="text-muted-foreground">Feedback: {log.reviewComment}</p>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(log)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Log</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <DailyLogForm
                mode="edit"
                log={selectedLog}
                onComplete={handleEditComplete}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
})