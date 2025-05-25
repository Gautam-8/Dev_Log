"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRole } from "@/lib/types"
import { format, subDays } from "date-fns"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Download } from "lucide-react"

interface DailyLog {
  id: string
  user: { // Assuming user data is included in the response
    id: string
    firstName: string
    lastName: string
    email: string
  }
  logDate: string
  tasks: string
  timeSpent: Array<{
    hours: number
    minutes: number
  }>
  mood: string
  blockers?: string
  isReviewed: boolean
  reviewComment?: string
}

interface Developer {
  id: string
  firstName: string
  lastName: string
}

const MOOD_DISPLAY = {
  'GREAT': '😊 Great',
  'GOOD': '🙂 Good',
  'NEUTRAL': '😐 Neutral',
  'NOT_GREAT': '🙁 Not Great',
  'BAD': '😢 Bad',
} as const;

export default function ManagerDashboard() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [filters, setFilters] = useState({
    date: "",
    developerId: "",
    hasBlockers: false,
  })
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedLogForReview, setSelectedLogForReview] = useState<DailyLog | null>(null)
  const [reviewComment, setReviewComment] = useState("")
  const [isReviewed, setIsReviewed] = useState(false)
  const [reportStartDate, setReportStartDate] = useState<Date>(subDays(new Date(), 7))
  const [reportEndDate, setReportEndDate] = useState<Date>(new Date());
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;


  const { toast } = useToast()
  const router = useRouter()

  const fetchTeamLogs = async (currentFilters: typeof filters) => {
    console.log('Fetching team logs with filters:', currentFilters);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        router.push("/login")
        return
      }

      // TODO: Check user role is Manager. If not, redirect or show error.

      const queryParams = new URLSearchParams({
        ...(currentFilters.date && { date: currentFilters.date }),
        ...(currentFilters.developerId !== "all" && currentFilters.developerId && { developerId: currentFilters.developerId }),
        ...(currentFilters.hasBlockers && { hasBlockers: "true" }),
      }).toString()

      const response = await fetch(`${backendUrl}/dailylogs/team${queryParams ? `?${queryParams}` : ""}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
         router.push("/login")
         return
      }
       if (response.status === 403) {
         toast({
           title: "Access Denied",
           description: "You do not have permission to view this page.",
           variant: "destructive",
         });
         router.push("/dashboard/developer"); // Redirect non-managers
         return
       }

      if (!response.ok) throw new Error("Failed to fetch team logs")

      const data = await response.json()
      setLogs(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load team logs",
      })
    }
  }

  useEffect(() => {
    console.log('Filters state changed:', filters);
    fetchTeamLogs(filters) // Fetch logs with initial filters

    const fetchDevelopers = async () => {
      try {
         const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          // Already handled in fetchTeamLogs, but good practice
          return
        }

        const response = await fetch(`${backendUrl}/users/developers`, {
           headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch developers");
        const data = await response.json();
        setDevelopers(data);
      } catch (error) {
         toast({
          title: "Error",
          description: "Failed to load developers list.",
        });
      }
    };

    fetchDevelopers();

  }, [toast, router, filters]) // Re-fetch logs when filters change

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    if (key === "developerId" && value === "") {
       value = "all";
    }
    setFilters((prevFilters) => ({ ...prevFilters, [key]: value }))
  }

  const handleReviewClick = (log: DailyLog) => {
     setSelectedLogForReview(log);
     setReviewComment(log.reviewComment || "");
     setIsReviewed(log.isReviewed);
     setIsReviewDialogOpen(true);
  }

  const handleReviewSave = async () => {
     if (!selectedLogForReview) return;

     try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          router.push("/login")
          return
        }

        const response = await fetch(`${backendUrl}/dailylogs/${selectedLogForReview.id}/review`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isReviewed,
            reviewComment,
          }),
        });

        if (response.status === 401) {
           router.push("/login")
           return
        }

        if (!response.ok) throw new Error("Failed to save review");

        toast({
          title: "Success",
          description: "Log review saved successfully.",
        });

        // Refresh logs after saving review
        fetchTeamLogs(filters);
        setIsReviewDialogOpen(false);
        setSelectedLogForReview(null);
     } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Something went wrong saving review.",
          variant: "destructive"
        });
     }
  };

  const handleGenerateReport = async (reportFormat: 'pdf' | 'csv') => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        router.push("/login")
        return
      }

      const startDate = format(reportStartDate, 'yyyy-MM-dd')
      const endDate = format(reportEndDate, 'yyyy-MM-dd')
      
      const response = await fetch(
        `${backendUrl}/reports/weekly?startDate=${startDate}&endDate=${endDate}&format=${reportFormat}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to generate report')

      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weekly-report-${startDate}-to-${endDate}.${reportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: `Report downloaded successfully in ${reportFormat.toUpperCase()} format.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6 max-w-screen-xl mx-auto px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Team Daily Logs</CardTitle>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-wrap gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !reportStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reportStartDate ? format(reportStartDate, "PPP") : <span>Start Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reportStartDate}
                    onSelect={(date) => date && setReportStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !reportEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reportEndDate ? format(reportEndDate, "PPP") : <span>End Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reportEndDate}
                    onSelect={(date) => date && setReportEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleGenerateReport('pdf')} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button onClick={() => handleGenerateReport('csv')} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap gap-4 items-center">
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="w-auto border border-gray-700 text-foreground"
              />
              <Select onValueChange={(value) => handleFilterChange("developerId", value)} value={filters.developerId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Developer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Developers</SelectItem>
                  {developers.map((dev) => (
                    <SelectItem key={dev.id} value={dev.id}>
                      {`${dev.firstName} ${dev.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Checkbox id="blockers" checked={filters.hasBlockers} onCheckedChange={(checked: boolean) => handleFilterChange("hasBlockers", checked)} />
                <Label htmlFor="blockers">Show Blockers Only</Label>
              </div>
              <Button onClick={() => setFilters({ date: "", developerId: "all", hasBlockers: false })}>Clear Filters</Button>
            </div>
          </div>
          <Table>
            <TableCaption>A list of your team's daily logs.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Tasks Completed</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Mood</TableHead>
                <TableHead>Blockers</TableHead>
                <TableHead>Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.logDate), "PPP")}</TableCell>
                  <TableCell>{`${log.user.firstName} ${log.user.lastName}`}</TableCell>
                  <TableCell>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: log.tasks }}
                    />
                  </TableCell>
                  <TableCell>
                    {log.timeSpent.reduce(
                      (sum, task) => sum + task.hours + task.minutes / 60,
                      0
                    ).toFixed(1)}{" "} hours
                  </TableCell>
                  <TableCell>{MOOD_DISPLAY[log.mood as keyof typeof MOOD_DISPLAY]}</TableCell>
                  <TableCell className={log.blockers ? "text-red-500" : "text-muted-foreground"}>
                    {log.blockers || "None"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {log.isReviewed && <span className="text-green-500">Reviewed</span>}
                      {log.reviewComment && <span className="text-muted-foreground text-sm italic">"{log.reviewComment.substring(0, 30)}..."</span>}
                      <Button variant="ghost" size="sm" onClick={() => handleReviewClick(log)}>
                        {log.isReviewed ? "Edit Review" : "Add Review"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Daily Log</DialogTitle>
          </DialogHeader>
          {selectedLogForReview && (
            <div className="grid gap-4 py-4">
              <div>
                 <Label htmlFor="reviewComment" className="text-right">Review Comment</Label>
                 <Textarea
                   id="reviewComment"
                   value={reviewComment}
                   onChange={(e) => setReviewComment(e.target.value)}
                   className="mt-1"
                   placeholder="Add your review comments here..."
                 />
              </div>
              <div className="flex items-center space-x-2">
                 <Checkbox id="isReviewed" checked={isReviewed} onCheckedChange={(checked: boolean) => setIsReviewed(checked)} />
                 <Label htmlFor="isReviewed">Mark as Reviewed</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleReviewSave}>Save Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
} 