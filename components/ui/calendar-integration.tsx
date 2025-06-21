"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, CalendarPlus, Download, Clock, MapPin, ExternalLink, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EventData {
  title: string
  description: string
  startDate: string
  endDate: string
  location: {
    venue: string
    address: string
    city: string
  }
  organizer: string
}

interface CalendarIntegrationProps {
  event: EventData
  className?: string
  variant?: "default" | "compact" | "detailed"
}

export function CalendarIntegration({ event, className, variant = "default" }: CalendarIntegrationProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [addedToCalendar, setAddedToCalendar] = useState(false)

  // Improved date formatting for different calendar systems
  const formatDateForCalendar = (startDateStr: string, endDateStr?: string) => {
    try {
      const startDate = new Date(startDateStr)
      const endDate = endDateStr ? new Date(endDateStr) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format")
      }

      // Format for calendar URLs (UTC format: YYYYMMDDTHHMMSSZ)
      const formatForCalendar = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      }

      // Format for display
      const formatForDisplay = (date: Date) => {
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      }

      return {
        start: formatForCalendar(startDate),
        end: formatForCalendar(endDate),
        startLocal: startDate,
        endLocal: endDate,
        startDisplay: formatForDisplay(startDate),
        endDisplay: formatForDisplay(endDate),
      }
    } catch (error) {
      console.error("Date formatting error:", error)
      throw new Error("Failed to format dates for calendar")
    }
  }

  const generateCalendarUrls = () => {
    try {
      const { start, end } = formatDateForCalendar(event.startDate, event.endDate)
      const location = `${event.location.venue}, ${event.location.address}, ${event.location.city}`
      const description = `${event.description}\n\nOrganized by: ${event.organizer}\n\nEvent Details: ${window.location.href}`

      // Properly encode all parameters
      const encodeParam = (str: string) =>
        encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`)

      return {
        google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeParam(
          event.title,
        )}&dates=${start}/${end}&details=${encodeParam(description)}&location=${encodeParam(location)}&sf=true&output=xml`,

        outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeParam(
          event.title,
        )}&startdt=${start}&enddt=${end}&body=${encodeParam(description)}&location=${encodeParam(location)}`,

        outlookOffice: `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeParam(
          event.title,
        )}&startdt=${start}&enddt=${end}&body=${encodeParam(description)}&location=${encodeParam(location)}`,

        yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeParam(
          event.title,
        )}&st=${start}&et=${end}&desc=${encodeParam(description)}&in_loc=${encodeParam(location)}`,

        apple: `data:text/calendar;charset=utf8,${encodeParam(generateICSContent(start, end, location, description))}`,
      }
    } catch (error) {
      console.error("URL generation error:", error)
      throw new Error("Failed to generate calendar URLs")
    }
  }

  const generateICSContent = (start?: string, end?: string, location?: string, description?: string) => {
    try {
      const { start: startFormatted, end: endFormatted } =
        start && end ? { start, end } : formatDateForCalendar(event.startDate, event.endDate)

      const locationFormatted = location || `${event.location.venue}, ${event.location.address}, ${event.location.city}`
      const descriptionFormatted = description || `${event.description}\\n\\nOrganized by: ${event.organizer}`

      const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@communityapp.com`

      return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Community App//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${startFormatted}
DTEND:${endFormatted}
SUMMARY:${event.title}
DESCRIPTION:${descriptionFormatted}
LOCATION:${locationFormatted}
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`
    } catch (error) {
      console.error("ICS generation error:", error)
      throw new Error("Failed to generate ICS file")
    }
  }

  const downloadICSFile = () => {
    try {
      const icsContent = generateICSContent()
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error("Download error:", error)
      return false
    }
  }

  const handleAddToCalendar = async (provider: string) => {
    setIsAdding(true)

    try {
      const urls = generateCalendarUrls()
      let success = false

      switch (provider) {
        case "google":
          window.open(urls.google, "_blank", "noopener,noreferrer")
          toast.success("Opening Google Calendar...")
          success = true
          break

        case "outlook":
          window.open(urls.outlook, "_blank", "noopener,noreferrer")
          toast.success("Opening Outlook Calendar...")
          success = true
          break

        case "outlook-office":
          window.open(urls.outlookOffice, "_blank", "noopener,noreferrer")
          toast.success("Opening Outlook Office...")
          success = true
          break

        case "yahoo":
          window.open(urls.yahoo, "_blank", "noopener,noreferrer")
          toast.success("Opening Yahoo Calendar...")
          success = true
          break

        case "apple":
          // For Apple Calendar, we'll download the ICS file
          success = downloadICSFile()
          if (success) {
            toast.success("Calendar file downloaded! Open it to add to Apple Calendar.")
          }
          break

        case "ics":
          success = downloadICSFile()
          if (success) {
            toast.success("Calendar file downloaded!")
          }
          break

        default:
          throw new Error("Unknown calendar provider")
      }

      if (success) {
        setAddedToCalendar(true)
        // Reset the success state after 3 seconds
        setTimeout(() => setAddedToCalendar(false), 3000)
      }
    } catch (error) {
      console.error("Calendar integration error:", error)
      toast.error("Failed to add to calendar. Please try again.")
    } finally {
      setTimeout(() => setIsAdding(false), 1000)
    }
  }

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isAdding}
            className={cn("transition-all duration-200", addedToCalendar && "bg-green-50 border-green-200", className)}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
            ) : addedToCalendar ? (
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <CalendarPlus className="h-4 w-4 mr-2" />
            )}
            {addedToCalendar ? "Added!" : "Add to Calendar"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleAddToCalendar("google")}>
            <Calendar className="h-4 w-4 mr-2" />
            Google Calendar
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("outlook")}>
            <Calendar className="h-4 w-4 mr-2" />
            Outlook.com
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("outlook-office")}>
            <Calendar className="h-4 w-4 mr-2" />
            Outlook Office
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("yahoo")}>
            <Calendar className="h-4 w-4 mr-2" />
            Yahoo Calendar
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("apple")}>
            <Calendar className="h-4 w-4 mr-2" />
            Apple Calendar
            <Download className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("ics")}>
            <Download className="h-4 w-4 mr-2" />
            Download .ics file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (variant === "detailed") {
    const { startLocal, endLocal } = formatDateForCalendar(event.startDate, event.endDate)

    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Calendar className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold">Add to Your Calendar</h3>
              <p className="text-sm text-gray-600">Never miss this event</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>
                {startLocal.toLocaleDateString()} at{" "}
                {startLocal.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {endLocal && ` - ${endLocal.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{event.location.venue}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleAddToCalendar("google")}
              variant="outline"
              size="sm"
              disabled={isAdding}
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Google
            </Button>
            <Button
              onClick={() => handleAddToCalendar("outlook")}
              variant="outline"
              size="sm"
              disabled={isAdding}
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Outlook
            </Button>
            <Button
              onClick={() => handleAddToCalendar("yahoo")}
              variant="outline"
              size="sm"
              disabled={isAdding}
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Yahoo
            </Button>
            <Button
              onClick={() => handleAddToCalendar("apple")}
              variant="outline"
              size="sm"
              disabled={isAdding}
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Apple
            </Button>
          </div>

          <Button
            onClick={() => handleAddToCalendar("ics")}
            variant="outline"
            size="sm"
            disabled={isAdding}
            className="w-full mt-2 justify-start"
          >
            <Download className="h-4 w-4 mr-2" />
            Download .ics file
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <div className={cn("flex gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isAdding}
            className={cn(
              "bg-violet-600 hover:bg-violet-700 transition-all duration-200",
              addedToCalendar && "bg-green-600 hover:bg-green-700",
            )}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : addedToCalendar ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <CalendarPlus className="h-4 w-4 mr-2" />
            )}
            {addedToCalendar ? "Added to Calendar!" : "Add to Calendar"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => handleAddToCalendar("google")}>
            <Calendar className="h-4 w-4 mr-2" />
            Google Calendar
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("outlook")}>
            <Calendar className="h-4 w-4 mr-2" />
            Outlook.com
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("outlook-office")}>
            <Calendar className="h-4 w-4 mr-2" />
            Outlook Office
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("yahoo")}>
            <Calendar className="h-4 w-4 mr-2" />
            Yahoo Calendar
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("apple")}>
            <Calendar className="h-4 w-4 mr-2" />
            Apple Calendar
            <Download className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddToCalendar("ics")}>
            <Download className="h-4 w-4 mr-2" />
            Download .ics file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
