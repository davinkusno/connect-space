"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  BookOpen,
  Video,
  FileText,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  User,
  Users,
  Settings,
  Shield,
  CreditCard,
  Globe,
  Smartphone,
  Laptop,
  Headphones,
  Zap,
  Star,
  Heart,
  Trophy,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/page-transition";
import { FloatingElements } from "@/components/ui/floating-elements";
import { EnhancedChatbotWidget } from "@/components/ai/enhanced-chatbot-widget";

const faqData = [
  {
    category: "Getting Started",
    icon: <Zap className="h-5 w-5" />,
    questions: [
      {
        question: "How do I create an account?",
        answer:
          "To create an account, click the 'Sign Up' button in the top right corner, fill in your details, and verify your email address. It's completely free!",
      },
      {
        question: "How do I join a community?",
        answer:
          "Browse communities on the Discover page, click on a community you're interested in, and hit the 'Join Community' button. Some communities may require approval.",
      },
      {
        question:
          "What's the difference between public and private communities?",
        answer:
          "Public communities are open to everyone and visible in search results. Private communities require an invitation or approval to join and are not publicly listed.",
      },
    ],
  },
  {
    category: "Account & Profile",
    icon: <User className="h-5 w-5" />,
    questions: [
      {
        question: "How do I update my profile?",
        answer:
          "Go to your profile page by clicking on your avatar in the top right corner, then click 'Edit Profile' to update your information, bio, and profile picture.",
      },
      {
        question: "How do I change my password?",
        answer:
          "Go to Settings > Account Security > Change Password. You'll need to enter your current password and create a new one.",
      },
      {
        question: "Can I delete my account?",
        answer:
          "Yes, you can delete your account by going to Settings > Account > Delete Account. This action is permanent and cannot be undone.",
      },
    ],
  },
  {
    category: "Communities",
    icon: <Users className="h-5 w-5" />,
    questions: [
      {
        question: "How do I create a community?",
        answer:
          "Click the 'Create Community' button on the Discover page or go to your Dashboard. Fill in the community details, set privacy settings, and invite members.",
      },
      {
        question: "How do I manage my community?",
        answer:
          "As a community admin, you can manage members, moderate content, create events, and customize settings from the community management page.",
      },
      {
        question: "How do I report inappropriate content?",
        answer:
          "Click the three dots menu next to any post or comment, select 'Report', and choose the reason. Our moderation team will review it promptly.",
      },
    ],
  },
  {
    category: "Events",
    icon: <Calendar className="h-5 w-5" />,
    questions: [
      {
        question: "How do I create an event?",
        answer:
          "Go to the Events page and click 'Create Event'. Fill in the event details, set the date and time, and choose whether it's public or private.",
      },
      {
        question: "Can I attend events virtually?",
        answer:
          "Yes! Many events support virtual attendance. Look for the video camera icon next to events that offer online participation.",
      },
      {
        question: "How do I get event reminders?",
        answer:
          "Enable notifications in your account settings. You'll receive email and in-app reminders for events you're attending.",
      },
    ],
  },
  {
    category: "Technical Support",
    icon: <Settings className="h-5 w-5" />,
    questions: [
      {
        question: "The app is running slowly. What should I do?",
        answer:
          "Try refreshing the page, clearing your browser cache, or updating to the latest version. If the problem persists, contact our support team.",
      },
      {
        question: "I'm having trouble uploading images. Help!",
        answer:
          "Make sure your image is under 10MB and in a supported format (JPG, PNG, GIF). Try using a different browser or check your internet connection.",
      },
      {
        question: "How do I enable notifications?",
        answer:
          "Click the bell icon in the top right corner, then go to Notification Settings. You can customize which notifications you want to receive.",
      },
    ],
  },
  {
    category: "Billing & Premium",
    icon: <CreditCard className="h-5 w-5" />,
    questions: [
      {
        question: "Is ConnectSpace free to use?",
        answer:
          "Yes! ConnectSpace offers a free tier with access to most features. Premium features are available with our Pro subscription.",
      },
      {
        question: "What's included in the Pro subscription?",
        answer:
          "Pro features include advanced analytics, priority support, custom branding, unlimited events, and exclusive community tools.",
      },
      {
        question: "How do I cancel my subscription?",
        answer:
          "Go to Settings > Billing > Manage Subscription and click 'Cancel Subscription'. You'll retain access until the end of your billing period.",
      },
    ],
  },
];

const quickActions = [
  {
    title: "Contact Support",
    description: "Get help from our support team",
    icon: <MessageCircle className="h-6 w-6" />,
    href: "#contact",
    color: "bg-blue-500",
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step guides",
    icon: <Video className="h-6 w-6" />,
    href: "#tutorials",
    color: "bg-green-500",
  },
  {
    title: "Community Guidelines",
    description: "Learn about our community rules",
    icon: <Shield className="h-6 w-6" />,
    href: "#guidelines",
    color: "bg-purple-500",
  },
  {
    title: "Feature Requests",
    description: "Suggest new features",
    icon: <Lightbulb className="h-6 w-6" />,
    href: "#feedback",
    color: "bg-yellow-500",
  },
];

const contactMethods = [
  {
    title: "Live Chat",
    description: "Get instant help from our support team",
    icon: <MessageCircle className="h-6 w-6" />,
    availability: "Available 24/7",
    responseTime: "Usually responds in minutes",
    action: "Start Chat",
  },
  {
    title: "Email Support",
    description: "Send us a detailed message",
    icon: <Mail className="h-6 w-6" />,
    availability: "Mon-Fri 9AM-6PM EST",
    responseTime: "Usually responds within 24 hours",
    action: "Send Email",
  },
  {
    title: "Phone Support",
    description: "Speak directly with our team",
    icon: <Phone className="h-6 w-6" />,
    availability: "Mon-Fri 9AM-6PM EST",
    responseTime: "Immediate response",
    action: "Call Now",
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq");

  const filteredFAQs = faqData
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
        <FloatingElements />
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <HelpCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Help Center
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Find answers to your questions, get support, and learn how to make
              the most of ConnectSpace.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search for help articles, FAQs, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <div className="text-white">{action.icon}</div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-8"
          >
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Contact Us
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Resources
              </TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-8">
              {searchQuery && (
                <div className="mb-6">
                  <p className="text-gray-600">
                    Found{" "}
                    {filteredFAQs.reduce(
                      (acc, cat) => acc + cat.questions.length,
                      0
                    )}{" "}
                    results for "{searchQuery}"
                  </p>
                </div>
              )}

              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((category, categoryIndex) => (
                  <Card key={categoryIndex} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b">
                      <CardTitle className="flex items-center gap-3">
                        <div className="text-blue-600">{category.icon}</div>
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((faq, faqIndex) => (
                          <AccordionItem
                            key={faqIndex}
                            value={`${categoryIndex}-${faqIndex}`}
                            className="border-b last:border-b-0"
                          >
                            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                              <span className="text-left font-medium">
                                {faq.question}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4 text-gray-600">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))
              ) : searchQuery ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try searching with different keywords or browse our FAQ
                      categories.
                    </p>
                    <Button
                      onClick={() => setSearchQuery("")}
                      variant="outline"
                    >
                      Clear Search
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No FAQs available
                  </h3>
                  <p className="text-gray-600">
                    Please try again later or contact support for assistance.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contactMethods.map((method, index) => (
                  <Card
                    key={index}
                    className="group hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <div className="text-blue-600">{method.icon}</div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {method.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {method.description}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {method.availability}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          <Zap className="h-3 w-3" />
                          {method.responseTime}
                        </div>
                      </div>
                      <Button className="w-full" variant="outline">
                        {method.action}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Your name" />
                      <Input placeholder="Your email" type="email" />
                    </div>
                    <Input placeholder="Subject" />
                    <textarea
                      placeholder="Describe your issue or question..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button className="w-full">
                      Send Message
                      <Mail className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Video className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold">Video Tutorials</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Step-by-step video guides to help you get started
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Watch Now
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold">User Guide</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Comprehensive guide covering all features
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Read Guide
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold">Community Guidelines</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Learn about our community rules and best practices
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      View Guidelines
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Lightbulb className="h-6 w-6 text-yellow-600" />
                      </div>
                      <h3 className="font-semibold">Feature Requests</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Suggest new features or improvements
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Submit Idea
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="font-semibold">Report a Bug</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Help us improve by reporting issues
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Report Bug
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Heart className="h-6 w-6 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold">Success Stories</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Read how others are using ConnectSpace
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Read Stories
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <EnhancedChatbotWidget />
      </div>
    </PageTransition>
  );
}
