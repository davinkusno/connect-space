"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: "community" | "post" | "member" | "event";
  reportTargetId: string;
  reportTargetName?: string;
}

const REPORT_REASONS = {
  community: [
    { value: "violence_hate_harassment", label: "Violence, Hate Speech, or Harassment" },
    { value: "nudity_inappropriate", label: "Nudity or Inappropriate Sexual Content" },
    { value: "spam_poor_quality", label: "Spam or Poor Quality Content" },
    { value: "fraud_scam", label: "Fraud or Scam" },
    { value: "copyright_violation", label: "Intellectual Property or Copyright Violation" },
    { value: "other", label: "Other" },
  ],
  post: [
    { value: "violence_hate_harassment", label: "Violence, Hate Speech, or Harassment" },
    { value: "nudity_inappropriate", label: "Nudity or Inappropriate Sexual Content" },
    { value: "spam_poor_quality", label: "Spam or Poor Quality Content" },
    { value: "fraud_scam", label: "Fraud or Scam" },
    { value: "copyright_violation", label: "Intellectual Property or Copyright Violation" },
    { value: "other", label: "Other" },
  ],
  member: [
    { value: "violence_hate_harassment", label: "Violence, Hate Speech, or Harassment" },
    { value: "nudity_inappropriate", label: "Nudity or Inappropriate Sexual Content" },
    { value: "spam_poor_quality", label: "Spam or Poor Quality Content" },
    { value: "fraud_scam", label: "Fraud or Scam" },
    { value: "copyright_violation", label: "Intellectual Property or Copyright Violation" },
    { value: "other", label: "Other" },
  ],
  event: [
    { value: "violence_hate_harassment", label: "Violence, Hate Speech, or Harassment" },
    { value: "nudity_inappropriate", label: "Nudity or Inappropriate Sexual Content" },
    { value: "spam_poor_quality", label: "Spam or Poor Quality Content" },
    { value: "fraud_scam", label: "Fraud or Scam" },
    { value: "copyright_violation", label: "Intellectual Property or Copyright Violation" },
    { value: "other", label: "Other" },
  ],
};

export function ReportDialog({
  isOpen,
  onClose,
  reportType,
  reportTargetId,
  reportTargetName,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = REPORT_REASONS[reportType] || REPORT_REASONS.community;

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          target_id: reportTargetId,
          reason: selectedReason,
          details: details.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit report");
      }

      toast.success("Report submitted successfully. Our team will review it.");
      handleClose();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setDetails("");
    onClose();
  };

  const getReportTypeLabel = () => {
    switch (reportType) {
      case "community":
        return "this community";
      case "post":
        return "this post";
      case "member":
        return "this member";
      case "event":
        return "this event";
      default:
        return "this content";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Report {reportType === "community" ? "Community" : reportType === "post" ? "Post" : reportType === "member" ? "Member" : "Event"}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Help us keep ConnectSpace safe by reporting {getReportTypeLabel()}
                {reportTargetName && (
                  <span className="font-medium">: {reportTargetName}</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-6 py-4 min-h-0">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">
              What's the issue? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="space-y-2"
            >
              {reasons.map((reason) => (
                <div
                  key={reason.value}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50/50 transition-colors cursor-pointer"
                >
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label
                    htmlFor={reason.value}
                    className="flex-1 cursor-pointer text-sm font-medium text-gray-700"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-sm font-semibold text-gray-900">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Please provide any additional information that might help us understand the issue..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px] resize-none w-full"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {details.length}/500 characters
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Reports are reviewed by our moderation team. 
              False reports may result in action against your account.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-3 p-6 pt-4 border-t border-gray-200 bg-gray-50/50">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

