"use client"

import { useState } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
} from "date-fns"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, MapPin, Users } from "lucide-react"
import { AnimatedButton } from "./animated-button"
import { AnimatedCard } from "./animated-card"
import { Badge } from "./badge"

// Sample event data
const eventData = [
  {
    id: 1,
    title: "AI & Machine Learning Workshop",
    date: "2024-01-15",
    time: "6:00 PM - 9:00 PM",
    location: "WeWork SoHo",
    description: "Deep dive into modern AI techniques and practical applications",
    attendees: 45,
    category: "tech",
    community: "Tech Innovators",
    status: "attended",
    gradient: "gradient-primary",
    tags: ["AI", "Machine Learning", "Workshop"],
  },
  {
    id: 2,
    title: "Morning Yoga Session",
    date: "2024-01-15",
    time: "7:00 AM - 8:30 AM",
    location: "Central Park",
    description: "Refreshing morning yoga to start the day with positive energy",
    attendees: 23,
    category: "health",
    community: "Wellness Warriors",
    status: "attended",
    gradient: "gradient-secondary",
    tags: ["Yoga", "Wellness", "Morning"],
  },
  {
    id: 3,
    title: "Hiking at Bear Mountain",
    date: "2024-01-18",
    time: "8:00 AM - 4:00 PM",
    location: "Bear Mountain State Park",
    description: "Challenging hike with breathtaking views and great company",
    attendees: 32,
    category: "outdoor",
    community: "Outdoor Adventures",
    status: "attended",
    gradient: "gradient-tertiary",
    tags: ["Hiking", "Nature", "Adventure"],
  },
  {
    id: 4,
    title: "JavaScript Meetup",
    date: "2024-01-18",
    time: "7:00 PM - 9:30 PM",
    location: "Tech Hub Downtown",
    description: "Latest trends in JavaScript development and networking",
    attendees: 67,
    category: "tech",
    community: "Tech Innovators",
    status: "attended",
    gradient: "gradient-primary",
    tags: ["JavaScript", "Networking", "Development"],
  },
  {
    id: 5,
    title: "Poetry Reading Night",
    date: "2024-01-20",
    time: "7:30 PM - 10:00 PM",
    location: "Local Coffee Shop",
    description: "Evening of beautiful poetry and creative expression",
    attendees: 28,
    category: "arts",
    community: "Creative Writers",
    status: "attended",
    gradient: "gradient-quaternary",
    tags: ["Poetry", "Literature", "Creative"],
  },
  {
    id: 6,
    title: "Book Club Discussion",
    date: "2024-01-20",
    time: "2:00 PM - 4:00 PM",
    location: "City Library",
    description: "Engaging discussion about contemporary literature",
    attendees: 15,
    category: "arts",
    community: "Creative Writers",
    status: "attended",
    gradient: "gradient-tertiary",
    tags: ["Books", "Discussion", "Literature"],
  },
  {
    id: 7,
    title: "Startup Networking Event",
    date: "2024-01-25",
    time: "6:30 PM - 9:00 PM",
    location: "Innovation Hub",
    description: "Connect with fellow entrepreneurs and investors",
    attendees: 85,
    category: "business",
    community: "Tech Innovators",
    status: "attending",
    gradient: "gradient-primary",
    tags: ["Networking", "Startup", "Business"],
  },
  {
    id: 8,
    title: "Web Development Workshop",
    date: "2024-01-27",
    time: "10:00 AM - 3:00 PM",
    location: "Code Academy",
    description: "Hands-on workshop on modern web development techniques",
    attendees: 40,
    category: "tech",
    community: "Tech Innovators",
    status: "attending",
    gradient: "gradient-primary",
    tags: ["Web Development", "Coding", "Workshop"],
  },
  {
    id: 9,
    title: "Community Cleanup",
    date: "2024-01-28",
    time: "9:00 AM - 12:00 PM",
    location: "Riverside Park",
    description: "Join us in cleaning up our local park",
    attendees: 25,
    category: "community",
    community: "Outdoor Adventures",
    status: "attending",
    gradient: "gradient-secondary",
    tags: ["Volunteer", "Environment", "Community"],
  },
  {
    id: 10,
    title: "Photography Walk",
    date: "2024-01-29",
    time: "4:00 PM - 6:30 PM",
    location: "Historic District",
    description: "Capture beautiful moments in the historic part of town",
    attendees: 18,
    category: "arts",
    community: "Creative Writers",
    status: "maybe",
    gradient: "gradient-quaternary",
    tags: ["Photography", "Art", "Walking"],
  },
  // Current month events
  {
    id: 11,
    title: "Data Science Conference",
    date: new Date().toISOString().split("T")[0], // Today
    time: "9:00 AM - 5:00 PM",
    location: "Convention Center",
    description: "Annual conference on data science and analytics",
    attendees: 250,
    category: "tech",
    community: "Tech Innovators",
    status: "attending",
    gradient: "gradient-primary",
    tags: ["Data Science", "Conference", "Analytics"],
  },
  {
    id: 12,
    title: "Community Meetup",
    date: new Date().toISOString().split("T")[0], // Today
    time: "7:00 PM - 9:00 PM",
    location: "Community Center",
    description: "Monthly gathering of community members",
    attendees: 35,
    category: "community",
    community: "Outdoor Adventures",
    status: "attending",
    gradient: "gradient-secondary",
    tags: ["Community", "Networking", "Social"],
  },
]

// Helper function to get category color
const getCategoryColor = (category: string) => {
  switch (category) {
    case "tech":
      return "bg-blue-500"
    case "health":
      return "bg-green-500"
    case "outdoor":
      return "bg-emerald-500"
    case "arts":
      return "bg-purple-500"
    case "business":
      return "bg-amber-500"
    case "community":
      return "bg-pink-500"
    default:
      return "bg-gray-500"
  }
}

// Helper function to get category icon
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "tech":
      return "💻"
    case "health":
      return "🧘"
    case "outdoor":
      return "🏞️"
    case "arts":
      return "🎨"
    case "business":
      return "💼"
    case "community":
      return "👥"
    default:
      return "📅"
  }
}

export function EnhancedCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Navigation functions
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  // Get days for the current month view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Add days from previous and next month to fill the calendar grid
  const startDay = monthStart.getDay() // 0 = Sunday, 1 = Monday, etc.
  const endDay = 6 - monthEnd.getDay() // Days needed to complete the last week

  // Create previous month days
  const prevMonthDays = []
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(monthStart)
    date.setDate(date.getDate() - (i + 1))
    prevMonthDays.push(date)
  }

  // Create next month days
  const nextMonthDays = []
  for (let i = 1; i <= endDay; i++) {
    const date = new Date(monthEnd)
    date.setDate(date.getDate() + i)
    nextMonthDays.push(date)
  }

  // Combine all days
  const calendarDays = [...prevMonthDays, ...monthDays, ...nextMonthDays]

  // Get events for the selected date
  const getEventsForDate = (date: Date) => {
    return eventData.filter((event) => {
      const eventDate = parseISO(event.date)
      return isSameDay(eventDate, date)
    })
  }

  // Check if a date has events
  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0
  }

  // Get events for the selected date
  const selectedDateEvents = getEventsForDate(selectedDate)

  // Get day of week headers
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex space-x-2">
          <AnimatedButton
            variant="glass"
            size="sm"
            className="p-1 h-8 w-8 flex items-center justify-center"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </AnimatedButton>
          <AnimatedButton
            variant="glass"
            size="sm"
            className="p-1 h-8 w-8 flex items-center justify-center"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </AnimatedButton>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {weekDays.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 bg-white">
          {calendarDays.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = isSameDay(day, selectedDate)
            const dayHasEvents = hasEvents(day)
            const dayEvents = getEventsForDate(day)
            const isCurrentDay = isToday(day)

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`
                  min-h-[70px] p-2 border-t border-r border-gray-200 
                  ${i % 7 === 0 ? "border-l" : ""} 
                  ${i >= calendarDays.length - 7 ? "border-b" : ""}
                  ${isSelected ? "bg-purple-50" : "hover:bg-gray-50"} 
                  ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                  relative transition-colors duration-200
                `}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`
                      text-sm font-medium 
                      ${isCurrentDay ? "bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Event indicators */}
                  {dayHasEvents && (
                    <div className="flex flex-wrap gap-1 mt-1 justify-center">
                      {dayEvents.slice(0, 3).map((event, index) => (
                        <span
                          key={index}
                          className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)}`}
                          title={event.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs text-gray-500 font-medium">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-purple-600" />
            Events on {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h4>

          {selectedDateEvents.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedDateEvents.map((event, index) => (
                <AnimatedCard
                  key={event.id}
                  variant="glass"
                  className="p-4 group hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`absolute inset-0 ${event.gradient} opacity-5 rounded-lg group-hover:opacity-10 transition-opacity duration-300`}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">
                          {getCategoryIcon(event.category)}
                        </span>
                        <h5 className="font-bold text-purple-700 group-hover:text-purple-800 transition-colors duration-300">
                          {event.title}
                        </h5>
                      </div>
                      <Badge
                        className={`${
                          event.status === "attended"
                            ? "bg-green-500 text-white"
                            : event.status === "attending"
                              ? "bg-blue-500 text-white"
                              : "bg-yellow-500 text-white"
                        } border-0`}
                      >
                        {event.status === "attended"
                          ? "Attended"
                          : event.status === "attending"
                            ? "Attending"
                            : "Maybe"}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2 font-medium">{event.community}</p>
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">{event.description}</p>

                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>{event.attendees} attendees</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-wrap gap-1">
                        {event.tags.slice(0, 2).map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            variant="outline"
                            className="text-xs border-purple-200 text-purple-600 bg-purple-50"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {event.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                            +{event.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      <AnimatedButton variant="glass" size="sm">
                        Details
                      </AnimatedButton>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No events on this date</p>
              <p className="text-xs text-gray-400 mt-1">Select another date to view events</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
