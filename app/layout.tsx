import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NavbarWrapper } from "@/components/navigation/navbar-wrapper";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";

export const metadata: Metadata = {
  title: "ConnectSpace",
  description: "A Community Finding App",
  icons: {
    icon: "/logoWhiteBackground.png",
    shortcut: "/logoWhiteBackground.png",
    apple: "/logoWhiteBackground.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <OnboardingGuard>
          <NavbarWrapper />
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </OnboardingGuard>
      </body>
    </html>
  );
}
