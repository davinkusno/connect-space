"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UpdateRsvpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: boolean; // true = going, false = not going
  onUpdate: (isGoing: boolean) => void;
}

export function UpdateRsvpDialog({
  open,
  onOpenChange,
  currentStatus,
  onUpdate,
}: UpdateRsvpDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    currentStatus ? "going" : "not-going"
  );

  const handleUpdate = () => {
    const isGoing = selectedStatus === "going";
    onUpdate(isGoing);

    if (isGoing) {
      toast.success("RSVP updated!", {
        description: "You're confirmed to attend this event.",
      });
    } else {
      toast.success("RSVP updated!", {
        description: "You've declined this event.",
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
            Update your RSVP
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          <RadioGroup
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            className="space-y-3"
          >
            {/* Going Option */}
            <div
              className={`relative flex items-center space-x-3 rounded-3xl border-2 p-5 cursor-pointer transition-all ${
                selectedStatus === "going"
                  ? "border-violet-600 bg-violet-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedStatus("going")}
            >
              <RadioGroupItem
                value="going"
                id="going"
                className="h-5 w-5 border-2 border-gray-400 data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600"
              />
              <Label
                htmlFor="going"
                className="flex-1 cursor-pointer text-base font-normal"
              >
                Going
              </Label>
            </div>

            {/* Not Going Option */}
            <div
              className={`relative flex items-center space-x-3 rounded-3xl border-2 p-5 cursor-pointer transition-all ${
                selectedStatus === "not-going"
                  ? "border-violet-600 bg-violet-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedStatus("not-going")}
            >
              <RadioGroupItem
                value="not-going"
                id="not-going"
                className="h-5 w-5 border-2 border-gray-400 data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600"
              />
              <Label
                htmlFor="not-going"
                className="flex-1 cursor-pointer text-base font-normal"
              >
                Not going
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
