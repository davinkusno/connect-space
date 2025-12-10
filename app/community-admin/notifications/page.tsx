"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import {
    Bell, Calendar as CalendarIcon, Calendar as EventIcon, CheckCircle,
    ChevronDown, Clock, Search, Trash2,
    UserPlus, X
} from "lucide-react"
import { useMemo, useState } from "react"

interface Notification {
  id: string
  type: "member" | "event"
  title: string
  message: string
  timestamp: string
  read: boolean
  userAvatar?: string
  userName?: string
  eventName?: string
  eventDate?: string
}

export default function CommunityAdminNotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [readStatusFilter, setReadStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "member",
      title: "New Member Joined",
      message: "Sarah Johnson has joined the community!",
      timestamp: "2024-01-15T10:30:00Z",
      read: false,
      userAvatar: "/placeholder-user.jpg",
      userName: "Sarah Johnson"
    },
    {
      id: "2",
      type: "event",
      title: "Event Starting Today",
      message: "Tech Meetup 2024 will start in 2 hours",
      timestamp: "2024-01-15T08:00:00Z",
      read: false,
      eventName: "Tech Meetup 2024",
      eventDate: "2024-01-15"
    },
    {
      id: "3",
      type: "member",
      title: "Member Left",
      message: "Mike Chen has left the community",
      timestamp: "2024-01-14T16:45:00Z",
      read: true,
      userAvatar: "/placeholder-user.jpg",
      userName: "Mike Chen"
    },
    {
      id: "4",
      type: "event",
      title: "Event Reminder",
      message: "Workshop: React Best Practices starts tomorrow",
      timestamp: "2024-01-14T14:20:00Z",
      read: false,
      eventName: "Workshop: React Best Practices",
      eventDate: "2024-01-16"
    },
    {
      id: "5",
      type: "member",
      title: "New Member Joined",
      message: "Alex Rodriguez has joined the community!",
      timestamp: "2024-01-14T11:15:00Z",
      read: true,
      userAvatar: "/placeholder-user.jpg",
      userName: "Alex Rodriguez"
    },
    {
      id: "6",
      type: "event",
      title: "Event Completed",
      message: "Annual Community Gathering has ended successfully",
      timestamp: "2024-01-13T20:00:00Z",
      read: true,
      eventName: "Annual Community Gathering",
      eventDate: "2024-01-13"
    }
  ])

  // Filter notifications based on search, type, and date
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(notification => notification.type === typeFilter)
    }

    // Read status filter
    if (readStatusFilter !== "all") {
      filtered = filtered.filter(notification => {
        if (readStatusFilter === "read") {
          return notification.read
        } else if (readStatusFilter === "unread") {
          return !notification.read
        }
        return true
      })
    }

    // Date filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(notification => {
        const notificationDate = new Date(notification.timestamp)
        
        if (dateRange.from && dateRange.to) {
          return notificationDate >= dateRange.from && notificationDate <= dateRange.to
        } else if (dateRange.from) {
          return notificationDate >= dateRange.from
        } else if (dateRange.to) {
          return notificationDate <= dateRange.to
        }
        return true
      })
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [notifications, searchQuery, typeFilter, readStatusFilter, dateRange])

  const handleClearAll = () => {
    setNotifications([])
  }

  const handleClearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ))
  }

  const handleReadAll = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
  }

  const getDateFilterText = () => {
    if (dateRange.from && dateRange.to) {
      // Same date = single pick
      if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
        return format(dateRange.from, "MMM dd, yyyy")
      }
      // Different dates = range pick
      return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
    }
    if (dateRange.from) {
      return `From ${format(dateRange.from, "MMM dd")}`
    }
    if (dateRange.to) {
      return `Until ${format(dateRange.to, "MMM dd")}`
    }
    return "Filter Date"
  }

  const clearDateFilter = () => {
    setDateRange({from: undefined, to: undefined})
  }

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Generate years (2020-2030)
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i)

  // Handle month/year change
  const handleMonthChange = (month: string) => {
    setCurrentMonth(parseInt(month))
  }

  const handleYearChange = (year: string) => {
    setCurrentYear(parseInt(year))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "member":
        return <UserPlus className="w-5 h-5 text-blue-600" />
      case "event":
        return <EventIcon className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "member":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "event":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-8 h-8 text-purple-600" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and monitor your community notifications
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                {unreadCount} unread
              </Badge>
              <Button
                variant="outline"
                onClick={handleReadAll}
                disabled={unreadCount === 0}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Read All
              </Button>
              <Button
                variant="outline"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="member">Members</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                </SelectContent>
              </Select>

              {/* Read Status Filter */}
              <Select value={readStatusFilter} onValueChange={setReadStatusFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {getDateFilterText()}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4">
                    <div className="space-y-4">
                      {/* Custom Month/Year Picker */}
                      <div className="flex justify-center items-center gap-2">
                        <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                          <SelectTrigger className="w-32">
                            <SelectValue>{monthNames[currentMonth]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {monthNames.map((month, index) => (
                              <SelectItem key={month} value={index.toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                          <SelectTrigger className="w-24">
                            <SelectValue>{currentYear}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Calendar */}
                      <div className="relative">
                        <Calendar
                          mode="range"
                          selected={{from: dateRange.from, to: dateRange.to}}
                          onSelect={(range) => {
                            setDateRange(range || {from: undefined, to: undefined})
                            setShowDatePicker(false)
                          }}
                          initialFocus
                          className="rounded-md border-0"
                          month={new Date(currentYear, currentMonth)}
                          onMonthChange={(date) => {
                            setCurrentMonth(date.getMonth())
                            setCurrentYear(date.getFullYear())
                          }}
                          classNames={{
                            caption: "hidden", // Hide default caption
                            nav: "flex items-center",
                            nav_button_previous: "absolute left-1 top-1/2 -translate-y-1/2",
                            nav_button_next: "absolute right-1 top-1/2 -translate-y-1/2",
                            head_cell: "text-gray-600 font-semibold text-center py-2",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                            day_range_end: "day-range-end",
                            day_selected: "bg-purple-600 text-white hover:bg-purple-700 focus:bg-purple-700",
                            day_today: "bg-purple-100 text-purple-900 font-semibold",
                            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-purple-200 aria-selected:text-purple-900",
                            day_hidden: "invisible",
                          }}
                        />
                      </div>
                    </div>
                    {/* Clear Button */}
                    {(dateRange.from || dateRange.to) && (
                      <div className="pt-3 border-t mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearDateFilter}
                          className="w-full text-gray-600 hover:text-red-600"
                        >
                          Clear Filter
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Notifications ({filteredNotifications.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-500">
                  {notifications.length === 0 
                    ? "You don't have any notifications yet" 
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all hover:shadow-sm ${
                      notification.read 
                        ? "bg-gray-50 border-gray-200" 
                        : "bg-white border-purple-200 shadow-sm"
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {notification.type === "member" && notification.userAvatar ? (
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={notification.userAvatar} alt={notification.userName} />
                          <AvatarFallback className="text-sm">
                            {notification.userName?.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${notification.read ? "text-gray-600" : "text-gray-900"}`}>
                              {notification.title}
                            </h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                            >
                              {notification.type}
                            </Badge>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                            )}
                          </div>
                          <p className={`text-sm ${notification.read ? "text-gray-500" : "text-gray-700"} mb-2`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(notification.timestamp), "MMM dd, yyyy 'at' h:mm a")}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearNotification(notification.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
