"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, User } from "lucide-react";

interface Attendee {
  id: string;
  name: string;
  image: string;
}

interface AttendeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAttendees: number;
  maxAttendees: number;
  eventTitle: string;
}

export function AttendeesDialog({
  open,
  onOpenChange,
  totalAttendees,
  maxAttendees,
  eventTitle,
}: AttendeesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Dummy data - replace with actual API call
  const [attendees] = useState<Attendee[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: "2",
      name: "Dr. Michael Chen",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: "4",
      name: "James Wilson",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: "5",
      name: "Lisa Anderson",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: "6",
      name: "David Kumar",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: "7",
      name: "Maria Garcia",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: "8",
      name: "Robert Taylor",
      image: "/placeholder.svg?height=50&width=50",
    },
  ]);

  const filteredAttendees = attendees.filter((attendee) => {
    return attendee.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Event Attendees ({totalAttendees})
              </DialogTitle>
              <DialogDescription className="mt-1">
                {eventTitle}
              </DialogDescription>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600">
                {totalAttendees} / {maxAttendees} registered
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{maxAttendees - totalAttendees} spots left</span>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search attendees by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Attendees List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {filteredAttendees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No attendees found</p>
              </div>
            ) : (
              filteredAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={attendee.image} alt={attendee.name} />
                    <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {attendee.name}
                    </h4>
                  </div>

                  <Button size="sm" variant="outline" className="flex-shrink-0">
                    <User className="h-4 w-4 mr-1" />
                    View Profile
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
