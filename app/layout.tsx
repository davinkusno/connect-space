import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { WishlistProvider } from "@/components/wishlist/wishlist-provider"
import { UnifiedNav } from "@/components/navigation/unified-nav"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "ConnectSpace",
  description: "A Community Finding App",
  icons: {
    icon: '/logoWhiteBackground.png',
    shortcut: '/logoWhiteBackground.png',
    apple: '/logoWhiteBackground.png',
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <WishlistProvider>
          <UnifiedNav />
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </WishlistProvider>
      </body>
    </html>
  )
}
