"use client";

import { SuperAdminNav } from "@/components/navigation/superadmin-nav";
import { AdsManagement } from "@/components/superadmin/ads-management";
import { FloatingElements } from "@/components/ui/floating-elements";
import { PageTransition } from "@/components/ui/page-transition";

export default function AdsManagementPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
        <FloatingElements />
        <SuperAdminNav />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <AdsManagement />
        </div>
      </div>
    </PageTransition>
  );
}
