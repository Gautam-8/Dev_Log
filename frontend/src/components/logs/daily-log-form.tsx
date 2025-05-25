"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { RichTextEditor } from '../ui/rich-text-editor'
import { type LogsListRef } from './logs-list'
import { type RefObject } from 'react'

const timeSpentSchema = z.object({
  taskId: z.string(),
  hours: z.number().min(0).max(24),
  minutes: z.number().min(0).max(59),
})

const formSchema = z.object({
  tasks: z.string().min(1, "Tasks are required"),
  timeSpent: z.array(timeSpentSchema).min(1, "At least one time entry is required"),
  mood: z.string().min(1, "Mood is required"),
  blockers: z.string().optional(),
  logDate: z.string().min(1, "Date is required"),
})

type FormData = z.infer<typeof formSchema> & {
  id?: string
}

interface DailyLogFormProps {
  mode?: "create" | "edit"
  log?: FormData
  onComplete?: () => void
  logsListRef?: RefObject<LogsListRef | null>;
}

const MOOD_OPTIONS = [
  { value: 'GREAT', label: '😊 Great' },
  { value: 'GOOD', label: '🙂 Good' },
  { value: 'NEUTRAL', label: '😐 Neutral' },
  { value: 'NOT_GREAT', label: '🙁 Not Great' },
  { value: 'BAD', label: '😢 Bad' },
] as const;

export function DailyLogForm({ mode = "create", log, onComplete, logsListRef }: DailyLogFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: log || {
      tasks: "",
      timeSpent: [{ taskId: crypto.randomUUID(), hours: 0, minutes: 0 }],
      mood: "",
      blockers: "",
      logDate: new Date().toISOString().split("T")[0],
    },
  })

  async function onSubmit(values: FormData) {
    setIsLoading(true)
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        router.push("/login")
        return
      }

      // Use environment variable for backend URL


      const url = mode === "edit" && log
        ? `${backendUrl}/dailylogs/${log.id}`
        : `${backendUrl}/dailylogs`;

      const response = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          logDate: new Date(values.logDate).toISOString(),
        }),
      })

      if (response.status === 401) {
        router.push("/login")
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit log")
      }

      toast({
        title: "Success",
        description: mode === "edit" ? "Log updated successfully" : "Log submitted successfully",
      })

      // Refresh logs list after successful submission/edit
      logsListRef?.current?.refresh();

      if (mode === "create") {
        form.reset()
      } else {
        onComplete?.()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="logDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tasks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasks Completed</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="What tasks did you complete today?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              {form.watch("timeSpent").map((_, index) => (
                <div key={index} className="flex gap-4">
                  <FormField
                    control={form.control}
                    name={`timeSpent.${index}.hours`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`timeSpent.${index}.minutes`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Minutes</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  form.setValue("timeSpent", [
                    ...form.getValues("timeSpent"),
                    { taskId: crypto.randomUUID(), hours: 0, minutes: 0 },
                  ])
                }
              >
                Add Time Entry
              </Button>
            </div>
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How are you feeling?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOOD_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="blockers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blockers (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any blockers or challenges?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? mode === "edit"
                  ? "Updating..."
                  : "Submitting..."
                : mode === "edit"
                ? "Update Log"
                : "Submit Log"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 