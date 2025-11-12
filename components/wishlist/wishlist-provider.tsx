"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Event {
  id: number
  title: string
  description: string
  date: string
  time: string
  endTime?: string
  location: string
  category: string
  price: number
  image?: string
  organizer: string
  attendees: number
  maxAttendees: number
  tags: string[]
  featured?: boolean
  communityId?: number
  communityName?: string
}

interface WishlistContextType {
  wishlist: Event[]
  addToWishlist: (event: Event) => void
  removeFromWishlist: (eventId: number) => void
  isInWishlist: (eventId: number) => boolean
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

// Comprehensive dummy data for wishlisted events
const DUMMY_WISHLIST_EVENTS: Event[] = [
  {
    id: 1,
    title: "AI & Machine Learning Summit 2024",
    description:
      "Join industry leaders and researchers for a comprehensive exploration of the latest advances in artificial intelligence and machine learning. This summit features keynote presentations, hands-on workshops, and networking opportunities with top professionals in the field.",
    date: "2024-02-15",
    time: "9:00 AM",
    endTime: "6:00 PM",
    location: "San Francisco Convention Center, CA",
    category: "Technology",
    price: 299,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "Tech Innovators Hub",
    attendees: 847,
    maxAttendees: 1000,
    tags: ["AI", "Machine Learning", "Technology", "Networking", "Innovation"],
    featured: true,
    communityId: 1,
    communityName: "Tech Innovators",
  },
  {
    id: 2,
    title: "Sustainable Living Workshop",
    description:
      "Learn practical strategies for reducing your environmental footprint through sustainable living practices. This interactive workshop covers eco-friendly home solutions, sustainable fashion, and green technology adoption.",
    date: "2024-02-08",
    time: "2:00 PM",
    endTime: "5:00 PM",
    location: "Green Community Center, Portland, OR",
    category: "Environment",
    price: 0,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "EcoLife Community",
    attendees: 156,
    maxAttendees: 200,
    tags: ["Sustainability", "Environment", "Workshop", "Green Living", "Community"],
    featured: false,
    communityId: 2,
    communityName: "Eco Warriors",
  },
  {
    id: 3,
    title: "Digital Art & NFT Creation Masterclass",
    description:
      "Dive into the world of digital art creation and NFT minting. This masterclass covers digital painting techniques, blockchain basics, and the business side of selling digital art in the modern marketplace.",
    date: "2024-02-22",
    time: "10:00 AM",
    endTime: "4:00 PM",
    location: "Creative Arts Studio, Brooklyn, NY",
    category: "Creative",
    price: 150,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "Digital Artists Collective",
    attendees: 89,
    maxAttendees: 120,
    tags: ["Digital Art", "NFT", "Blockchain", "Creative", "Masterclass"],
    featured: true,
    communityId: 3,
    communityName: "Creative Minds",
  },
  {
    id: 4,
    title: "Startup Pitch Competition & Networking",
    description:
      "Watch innovative startups pitch their ideas to a panel of investors and industry experts. Network with entrepreneurs, investors, and fellow innovators while enjoying refreshments and live entertainment.",
    date: "2024-03-05",
    time: "6:00 PM",
    endTime: "10:00 PM",
    location: "Innovation Hub, Austin, TX",
    category: "Business",
    price: 75,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "Startup Austin",
    attendees: 234,
    maxAttendees: 300,
    tags: ["Startup", "Pitch", "Networking", "Investment", "Innovation"],
    featured: false,
    communityId: 4,
    communityName: "Startup Founders",
  },
  {
    id: 5,
    title: "Mindfulness & Meditation Retreat",
    description:
      "Escape the hustle and bustle of daily life with a peaceful mindfulness and meditation retreat. Learn various meditation techniques, practice yoga, and connect with like-minded individuals in a serene natural setting.",
    date: "2024-03-12",
    time: "8:00 AM",
    endTime: "6:00 PM",
    location: "Mountain View Retreat Center, Sedona, AZ",
    category: "Wellness",
    price: 120,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "Mindful Living Institute",
    attendees: 67,
    maxAttendees: 80,
    tags: ["Mindfulness", "Meditation", "Wellness", "Retreat", "Self-care"],
    featured: true,
    communityId: 5,
    communityName: "Wellness Warriors",
  },
  {
    id: 6,
    title: "Food & Wine Pairing Experience",
    description:
      "Indulge in an exquisite culinary journey featuring locally sourced ingredients paired with premium wines. Led by renowned chef Marcus Thompson and sommelier Sarah Chen, this experience combines education with exceptional dining.",
    date: "2024-02-28",
    time: "7:00 PM",
    endTime: "10:00 PM",
    location: "The Culinary Institute, Napa Valley, CA",
    category: "Food & Drink",
    price: 185,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "Gourmet Society",
    attendees: 45,
    maxAttendees: 60,
    tags: ["Food", "Wine", "Culinary", "Pairing", "Gourmet"],
    featured: false,
    communityId: 6,
    communityName: "Food Enthusiasts",
  },
  {
    id: 7,
    title: "Photography Walk: Urban Landscapes",
    description:
      "Explore the city through your lens with fellow photography enthusiasts. This guided walk covers composition techniques, lighting tips, and post-processing basics while capturing stunning urban landscapes.",
    date: "2024-02-18",
    time: "6:00 AM",
    endTime: "10:00 AM",
    location: "Downtown Seattle, WA",
    category: "Photography",
    price: 0,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "Seattle Photo Club",
    attendees: 28,
    maxAttendees: 35,
    tags: ["Photography", "Urban", "Walk", "Landscape", "Tutorial"],
    featured: false,
    communityId: 7,
    communityName: "Photo Enthusiasts",
  },
  {
    id: 8,
    title: "Blockchain & Cryptocurrency Workshop",
    description:
      "Demystify blockchain technology and cryptocurrency in this comprehensive workshop. Learn about different blockchain platforms, smart contracts, DeFi protocols, and investment strategies from industry experts.",
    date: "2024-03-20",
    time: "1:00 PM",
    endTime: "6:00 PM",
    location: "Tech Campus, Miami, FL",
    category: "Technology",
    price: 199,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "Crypto Education Hub",
    attendees: 156,
    maxAttendees: 200,
    tags: ["Blockchain", "Cryptocurrency", "DeFi", "Technology", "Investment"],
    featured: true,
    communityId: 1,
    communityName: "Tech Innovators",
  },
  {
    id: 9,
    title: "Community Garden Volunteer Day",
    description:
      "Join us for a rewarding day of community service at the local community garden. Help plant seasonal vegetables, maintain existing plots, and learn about sustainable gardening practices while making new friends.",
    date: "2024-02-10",
    time: "9:00 AM",
    endTime: "3:00 PM",
    location: "Riverside Community Garden, Denver, CO",
    category: "Community Service",
    price: 0,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "Green Thumb Volunteers",
    attendees: 42,
    maxAttendees: 50,
    tags: ["Volunteering", "Gardening", "Community", "Environment", "Service"],
    featured: false,
    communityId: 2,
    communityName: "Eco Warriors",
  },
  {
    id: 10,
    title: "Jazz Night at The Blue Note",
    description:
      "Experience an intimate evening of live jazz music featuring local and touring musicians. Enjoy craft cocktails and light appetizers while listening to smooth jazz, bebop, and contemporary fusion performances.",
    date: "2024-03-08",
    time: "8:00 PM",
    endTime: "11:00 PM",
    location: "The Blue Note Jazz Club, New Orleans, LA",
    category: "Music",
    price: 45,
    image: "/placeholder.svg?height=300&width=500",
    organizer: "Jazz Appreciation Society",
    attendees: 78,
    maxAttendees: 100,
    tags: ["Jazz", "Music", "Live Performance", "Cocktails", "Culture"],
    featured: false,
    communityId: 8,
    communityName: "Music Lovers",
  },
]

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Event[]>([])

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist")
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist)
        setWishlist(parsedWishlist)
      } catch (error) {
        console.error("Error parsing wishlist from localStorage:", error)
        // Initialize with dummy data if parsing fails
        setWishlist(DUMMY_WISHLIST_EVENTS.slice(0, 5))
      }
    } else {
      // Initialize with some dummy data for demonstration
      const initialWishlist = DUMMY_WISHLIST_EVENTS.slice(0, 5)
      setWishlist(initialWishlist)
      localStorage.setItem("wishlist", JSON.stringify(initialWishlist))
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (wishlist.length > 0) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist))
    }
  }, [wishlist])

  const addToWishlist = (event: Event) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.id === event.id)) {
        return prev // Event already in wishlist
      }
      const newWishlist = [...prev, event]
      localStorage.setItem("wishlist", JSON.stringify(newWishlist))
      return newWishlist
    })
  }

  const removeFromWishlist = (eventId: number) => {
    setWishlist((prev) => {
      const newWishlist = prev.filter((event) => event.id !== eventId)
      localStorage.setItem("wishlist", JSON.stringify(newWishlist))
      return newWishlist
    })
  }

  const isInWishlist = (eventId: number) => {
    return wishlist.some((event) => event.id === eventId)
  }

  const clearWishlist = () => {
    setWishlist([])
    localStorage.removeItem("wishlist")
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}

// Export dummy events for use in other components
export { DUMMY_WISHLIST_EVENTS }
