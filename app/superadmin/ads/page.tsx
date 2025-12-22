"use client";

import { SuperAdminNav } from "@/components/navigation/superadmin-nav";
import { AdsManagement } from "@/components/superadmin/ads-management";

export default function AdsManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <SuperAdminNav />
      <div className="container mx-auto px-4 py-8">
        <AdsManagement />
      </div>
    </div>
  );
}
