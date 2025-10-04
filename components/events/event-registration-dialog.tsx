"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  location: {
    venue: string;
    address: string;
    city: string;
  };
  price: {
    type: "free" | "paid";
    amount?: number;
    currency?: string;
  };
  organizer: {
    name: string;
  };
}

interface EventRegistrationDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EventRegistrationDialog({
  event,
  open,
  onOpenChange,
  onSuccess,
}: EventRegistrationDialogProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    ticketType: "general",
    specialRequirements: "",
    agreeToTerms: false,
    agreeToMarketing: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("Registration successful!", {
      description: "Check your email for confirmation details.",
    });

    setIsSubmitting(false);

    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }

    onOpenChange(false);

    // Reset form
    setStep(1);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      ticketType: "general",
      specialRequirements: "",
      agreeToTerms: false,
      agreeToMarketing: false,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-violet-600" />
            Register for Event
          </DialogTitle>
          <DialogDescription>
            Complete the form below to register for this event
          </DialogDescription>
        </DialogHeader>

        {/* Event Summary */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-lg border border-violet-200 mb-6">
          <h3 className="font-semibold text-lg mb-3">{event.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-violet-600" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-violet-600" />
              <span>{event.location.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4 text-violet-600" />
              <span>Organized by {event.organizer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {event.price.type === "free" ? (
                <Badge className="bg-green-500">FREE</Badge>
              ) : (
                <Badge className="bg-violet-600">
                  ${event.price.amount} {event.price.currency}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-violet-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-violet-600 text-white" : "bg-gray-200"
                }`}
              >
                {step > 1 ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200">
              <div
                className={`h-full transition-all ${
                  step >= 2 ? "bg-violet-600 w-full" : "w-0"
                }`}
              />
            </div>
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-violet-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-violet-600 text-white" : "bg-gray-200"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-violet-600" />
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-violet-600" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-violet-600" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Ticket Type */}
              <div className="space-y-2">
                <Label htmlFor="ticketType" className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-violet-600" />
                  Ticket Type
                </Label>
                <Select
                  value={formData.ticketType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, ticketType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Admission</SelectItem>
                    <SelectItem value="vip">VIP Pass</SelectItem>
                    <SelectItem value="student">Student Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Special Requirements */}
              <div className="space-y-2">
                <Label htmlFor="specialRequirements">
                  Special Requirements (Optional)
                </Label>
                <Textarea
                  id="specialRequirements"
                  name="specialRequirements"
                  placeholder="Dietary restrictions, accessibility needs, etc."
                  value={formData.specialRequirements}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                Continue to Confirmation
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Review Information */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Review Your Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket Type:</span>
                    <span className="font-medium capitalize">
                      {formData.ticketType.replace("-", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info (if paid) */}
              {event.price.type === "paid" && (
                <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-violet-600">
                      ${event.price.amount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    <CreditCard className="h-3 w-3 inline mr-1" />
                    Payment will be processed securely
                  </p>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        agreeToTerms: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    I agree to the{" "}
                    <a href="#" className="text-violet-600 hover:underline">
                      terms and conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-violet-600 hover:underline">
                      cancellation policy
                    </a>
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="marketing"
                    checked={formData.agreeToMarketing}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        agreeToMarketing: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="marketing" className="text-sm cursor-pointer">
                    Send me updates about similar events and offers
                  </Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.agreeToTerms}
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirm Registration
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
