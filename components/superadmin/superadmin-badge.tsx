"use client";

import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export function SuperadminBadge() {
  return (
    <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-md">
      <Shield className="w-3 h-3 mr-1" />
      Superadmin View
    </Badge>
  );
}



