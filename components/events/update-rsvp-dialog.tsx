"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { toast } from "sonner";

interface UpdateInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: boolean; // true = interested, false = not interested
  onUpdate: (isInterested: boolean) => void;
}

export function UpdateInterestDialog({
  open,
  onOpenChange,
  currentStatus,
  onUpdate,
}: UpdateInterestDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    currentStatus ? "interested" : "not-interested"
  );

  const handleUpdate = () => {
    const isInterested = selectedStatus === "interested";
    onUpdate(isInterested);

    if (isInterested) {
      toast.success("Interest updated!", {
        description: "You're now interested in joining this event.",
      });
    } else {
      toast.success("Interest removed!", {
        description: "You've removed your interest from this event.",
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 rounded-3xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-center text-xl font-semibold">
            Update your interest
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          <RadioGroup
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            className="space-y-3"
          >
            {/* Interested Option */}
            <div
              className={`relative flex items-center space-x-3 rounded-3xl border-2 p-5 cursor-pointer transition-all ${
                selectedStatus === "interested"
                  ? "border-violet-600 bg-violet-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedStatus("interested")}
            >
              <RadioGroupItem
                value="interested"
                id="interested"
                className="h-5 w-5 border-2 border-gray-400 data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600"
              />
              <Label
                htmlFor="interested"
                className="flex-1 cursor-pointer text-base font-normal"
              >
                Interested to join
              </Label>
            </div>

            {/* Not Interested Option */}
            <div
              className={`relative flex items-center space-x-3 rounded-3xl border-2 p-5 cursor-pointer transition-all ${
                selectedStatus === "not-interested"
                  ? "border-violet-600 bg-violet-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedStatus("not-interested")}
            >
              <RadioGroupItem
                value="not-interested"
                id="not-interested"
                className="h-5 w-5 border-2 border-gray-400 data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600"
              />
              <Label
                htmlFor="not-interested"
                className="flex-1 cursor-pointer text-base font-normal"
              >
                Not interested
              </Label>
            </div>
          </RadioGroup>

          {/* Update Button */}
          <Button
            onClick={handleUpdate}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-full py-6 text-base font-medium mt-6 shadow-md hover:shadow-lg transition-all"
          >
            Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Keep legacy export for backwards compatibility
export const UpdateRsvpDialog = UpdateInterestDialog;
