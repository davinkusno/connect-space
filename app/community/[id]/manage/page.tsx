"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    InViewTransition, SlideTransition
} from "@/components/ui/content-transitions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/loading-indicators";
import { ButtonPulse, HoverScale } from "@/components/ui/micro-interactions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertTriangle, Calendar, CheckCircle, Clock, Crown, Eye, Plus,
    Search, Settings, Shield, UserCheck, UserMinus, Users, UserX, XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

// Mock data for demonstration
const mockCommunity = {
  id: "1",
  name: "Tech Innovators",
  isPrivate: true,
  adminId: "admin-1",
  moderators: ["mod-1", "mod-2"],
};

const mockMembers = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah@example.com",
    role: "Admin",
    joinDate: "2022-01-15",
    avatar: "/placeholder.svg?height=40&width=40",
    lastActive: "2024-01-10",
    contributions: 45,
    status: "active",
  },
  {
    id: "2",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "Moderator",
    joinDate: "2022-02-20",
    avatar: "/placeholder.svg?height=40&width=40",
    lastActive: "2024-01-09",
    contributions: 32,
    status: "active",
  },
  {
    id: "3",
    name: "Lisa Wang",
    email: "lisa@example.com",
    role: "Member",
    joinDate: "2022-03-10",
    avatar: "/placeholder.svg?height=40&width=40",
    lastActive: "2024-01-08",
    contributions: 28,
    status: "active",
  },
  {
    id: "4",
    name: "Alex Rodriguez",
    email: "alex@example.com",
    role: "Member",
    joinDate: "2022-04-05",
    avatar: "/placeholder.svg?height=40&width=40",
    lastActive: "2024-01-07",
    contributions: 15,
    status: "inactive",
  },
];

const mockRequests = [
  {
    id: "1",
    name: "Emma Thompson",
    email: "emma@example.com",
    requestDate: "2024-01-08",
    message:
      "I'm a UX designer with 5 years of experience in tech. I'd love to join this community to share knowledge and learn from others.",
    avatar: "/placeholder.svg?height=40&width=40",
    linkedIn: "linkedin.com/in/emmathompson",
    github: "github.com/emmathompson",
  },
  {
    id: "2",
    name: "David Kim",
    email: "david@example.com",
    requestDate: "2024-01-07",
    message:
      "Data scientist looking to connect with fellow tech professionals and contribute to community discussions.",
    avatar: "/placeholder.svg?height=40&width=40",
    linkedIn: "linkedin.com/in/davidkim",
    github: "github.com/davidkim",
  },
  {
    id: "3",
    name: "Rachel Green",
    email: "rachel@example.com",
    requestDate: "2024-01-06",
    message:
      "Frontend developer passionate about React and modern web technologies. Excited to be part of this community!",
    avatar: "/placeholder.svg?height=40&width=40",
    linkedIn: "linkedin.com/in/rachelgreen",
    github: "github.com/rachelgreen",
  },
];

export default function ManageCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params Promise (Next.js 15+)
  const { id } = use(params);

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );

  // Event creation form state
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    endTime: "",
    location: "",
    category: "",
    maxAttendees: "",
    price: "",
    isPrivate: false,
  });

  // Check if user is admin (in real app, this would come from auth context)
  const isAdmin = true; // Mock admin status

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
            </p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredMembers = mockMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveMember = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Removing member:", selectedMember?.name);
    setIsLoading(false);
    setShowRemoveDialog(false);
    setSelectedMember(null);
  };

  const handleRequestAction = async (action: "approve" | "reject") => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`${action}ing request from:`, selectedRequest?.name);
    setIsLoading(false);
    setShowRequestDialog(false);
    setSelectedRequest(null);
    setActionType(null);
  };

  const handleCreateEvent = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Creating event:", eventForm);
    setIsLoading(false);
    setShowCreateEventDialog(false);
    setEventForm({
      title: "",
      description: "",
      date: "",
      time: "",
      endTime: "",
      location: "",
      category: "",
      maxAttendees: "",
      price: "",
      isPrivate: false,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "Moderator":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-medium text-violet-700">
                ConnectSpace
              </Link>
              <span className="text-gray-300">/</span>
              <Link
                href={`/community/${id}`}
                className="text-gray-600 hover:text-violet-700"
              >
                {mockCommunity.name}
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-medium">Manage</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Admin Panel
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <InViewTransition effect="fade">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Community
            </h1>
            <p className="text-gray-600">
              Administer your community members, handle join requests, and
              create events.
            </p>
          </div>
        </InViewTransition>

        {/* Quick Stats */}
        <InViewTransition effect="slide-up" delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Members
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {mockMembers.length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-violet-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {mockRequests.length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Members
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {mockMembers.filter((m) => m.status === "active").length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Community Type
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {mockCommunity.isPrivate ? "Private" : "Public"}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </InViewTransition>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Requests ({mockRequests.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <SlideTransition show={activeTab === "members"} direction="up">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Community Members
                    </CardTitle>
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredMembers.map((member, index) => (
                      <InViewTransition
                        key={member.id}
                        effect="fade"
                        delay={index * 50}
                      >
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-violet-200 transition-colors">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={member.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900">
                                  {member.name}
                                </h3>
                                {getRoleIcon(member.role)}
                                <Badge variant="outline" className="text-xs">
                                  {member.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {member.email}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  Joined{" "}
                                  {new Date(
                                    member.joinDate
                                  ).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {member.contributions} contributions
                                </span>
                                {getStatusBadge(member.status)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <HoverScale>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </HoverScale>
                            {member.role !== "Admin" && (
                              <HoverScale>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setShowRemoveDialog(true);
                                  }}
                                >
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </HoverScale>
                            )}
                          </div>
                        </div>
                      </InViewTransition>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </SlideTransition>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <SlideTransition show={activeTab === "requests"} direction="up">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Pending Join Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mockRequests.length > 0 ? (
                    <div className="space-y-6">
                      {mockRequests.map((request, index) => (
                        <InViewTransition
                          key={request.id}
                          effect="fade"
                          delay={index * 100}
                        >
                          <div className="border border-gray-200 rounded-lg p-6 hover:border-violet-200 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage
                                    src={request.avatar || "/placeholder.svg"}
                                  />
                                  <AvatarFallback>
                                    {request.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {request.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {request.email}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Requested{" "}
                                    {new Date(
                                      request.requestDate
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <HoverScale>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setActionType("approve");
                                      setShowRequestDialog(true);
                                    }}
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                </HoverScale>
                                <HoverScale>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setActionType("reject");
                                      setShowRequestDialog(true);
                                    }}
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </HoverScale>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-sm text-gray-900 mb-2">
                                Message:
                              </h4>
                              <p className="text-sm text-gray-700">
                                {request.message}
                              </p>
                            </div>
                            <div className="flex space-x-4 text-sm">
                              {request.linkedIn && (
                                <a
                                  href={`https://${request.linkedIn}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  LinkedIn
                                </a>
                              )}
                              {request.github && (
                                <a
                                  href={`https://${request.github}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  GitHub
                                </a>
                              )}
                            </div>
                          </div>
                        </InViewTransition>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No pending requests
                      </h3>
                      <p className="text-gray-600">
                        All join requests have been processed.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </SlideTransition>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <SlideTransition show={activeTab === "events"} direction="up">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Event Management
                    </CardTitle>
                    <ButtonPulse pulseColor="rgba(124, 58, 237, 0.3)">
                      <Button
                        onClick={() => setShowCreateEventDialog(true)}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                      </Button>
                    </ButtonPulse>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No events yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first community event to get started.
                    </p>
                    <Button
                      onClick={() => setShowCreateEventDialog(true)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SlideTransition>
          </TabsContent>
        </Tabs>
      </div>

      {/* Remove Member Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{selectedMember?.name}</strong> from the community? This
              action cannot be undone. The member will lose access to all
              community content and discussions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Removing...
                </>
              ) : (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Member
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Action Dialog */}
      <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {actionType === "approve" ? "Approve" : "Reject"} Join Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} the join request from{" "}
              <strong>{selectedRequest?.name}</strong>?
              {actionType === "approve"
                ? " They will be granted access to the community."
                : " They will be notified that their request was declined."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRequestAction(actionType!)}
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === "approve" ? (
                    <UserCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  {actionType === "approve" ? "Approve" : "Reject"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Event Dialog */}
      <Dialog
        open={showCreateEventDialog}
        onOpenChange={setShowCreateEventDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Create New Event
            </DialogTitle>
            <DialogDescription>
              Create a new event for your community. Fill in the details below
              to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={eventForm.category}
                  onValueChange={(value) =>
                    setEventForm({ ...eventForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="arts">Arts</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your event..."
                rows={4}
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm({ ...eventForm, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={eventForm.date}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Start Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={eventForm.time}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="Enter event location"
                value={eventForm.location}
                onChange={(e) =>
                  setEventForm({ ...eventForm, location: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  placeholder="Enter max attendees"
                  value={eventForm.maxAttendees}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, maxAttendees: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0 for free events"
                  value={eventForm.price}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, price: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateEventDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEvent}
              disabled={
                !eventForm.title ||
                !eventForm.description ||
                !eventForm.date ||
                !eventForm.time ||
                !eventForm.location ||
                !eventForm.category ||
                isLoading
              }
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
