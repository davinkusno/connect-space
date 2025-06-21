"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Star, ThumbsUp, ThumbsDown, Flag, MoreHorizontal, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Review {
  id: string
  user: {
    name: string
    avatar: string
    verified: boolean
    attendedEvents: number
  }
  rating: number
  title: string
  content: string
  date: string
  helpful: number
  notHelpful: number
  userVote?: "helpful" | "not-helpful"
  images?: string[]
}

interface EventReviewsProps {
  eventId: string
  userCanReview: boolean
}

const DUMMY_REVIEWS: Review[] = [
  {
    id: "1",
    user: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: true,
      attendedEvents: 12,
    },
    rating: 5,
    title: "Excellent event with great speakers!",
    content:
      "This was an outstanding summit with incredibly knowledgeable speakers. The content was cutting-edge and very relevant to current healthcare challenges. Networking opportunities were fantastic, and the venue was perfect. Highly recommend for anyone in the healthcare tech space.",
    date: "2024-02-15",
    helpful: 24,
    notHelpful: 2,
    userVote: "helpful",
  },
  {
    id: "2",
    user: {
      name: "Dr. Michael Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: true,
      attendedEvents: 8,
    },
    rating: 4,
    title: "Great content, could use better organization",
    content:
      "The speakers were top-notch and the topics were very relevant. However, the event could have been better organized - some sessions ran over time and there were long queues for lunch. Overall, still a valuable experience.",
    date: "2024-02-10",
    helpful: 18,
    notHelpful: 5,
  },
  {
    id: "3",
    user: {
      name: "Emily Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: false,
      attendedEvents: 3,
    },
    rating: 5,
    title: "Mind-blowing insights into AI applications",
    content:
      "As someone new to healthcare AI, this event was incredibly enlightening. The presentations were well-structured and easy to follow, even for beginners. The hands-on workshops were particularly valuable.",
    date: "2024-02-08",
    helpful: 15,
    notHelpful: 1,
  },
]

export function EventReviews({ eventId, userCanReview }: EventReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(DUMMY_REVIEWS)
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "helpful" | "rating">("newest")
  const [filterRating, setFilterRating] = useState<string>("all")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: "",
    content: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100,
  }))

  const sortedAndFilteredReviews = reviews
    .filter((review) => filterRating === "all" || review.rating.toString() === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "helpful":
          return b.helpful - a.helpful
        case "rating":
          return b.rating - a.rating
        default:
          return 0
      }
    })

  const handleVote = (reviewId: string, voteType: "helpful" | "not-helpful") => {
    setReviews((prev) =>
      prev.map((review) => {
        if (review.id === reviewId) {
          const currentVote = review.userVote
          let newHelpful = review.helpful
          let newNotHelpful = review.notHelpful
          let newUserVote: "helpful" | "not-helpful" | undefined = voteType

          // Remove previous vote
          if (currentVote === "helpful") newHelpful--
          if (currentVote === "not-helpful") newNotHelpful--

          // Add new vote (or remove if same vote)
          if (currentVote === voteType) {
            newUserVote = undefined // Remove vote if clicking same button
          } else {
            if (voteType === "helpful") newHelpful++
            if (voteType === "not-helpful") newNotHelpful++
          }

          return {
            ...review,
            helpful: newHelpful,
            notHelpful: newNotHelpful,
            userVote: newUserVote,
          }
        }
        return review
      }),
    )

    toast.success(
      reviews.find((r) => r.id === reviewId)?.userVote === voteType
        ? "Vote removed"
        : `Marked as ${voteType === "helpful" ? "helpful" : "not helpful"}`,
    )
  }

  const handleSubmitReview = async () => {
    if (!newReview.rating || !newReview.title.trim() || !newReview.content.trim()) {
      toast.error("Please fill in all fields and provide a rating")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const review: Review = {
        id: Date.now().toString(),
        user: {
          name: "You",
          avatar: "/placeholder.svg?height=40&width=40",
          verified: false,
          attendedEvents: 1,
        },
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content,
        date: new Date().toISOString().split("T")[0],
        helpful: 0,
        notHelpful: 0,
      }

      setReviews((prev) => [review, ...prev])
      setNewReview({ rating: 0, title: "", content: "" })
      setShowReviewForm(false)
      toast.success("Review submitted successfully!")
    } catch (error) {
      toast.error("Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({
    rating,
    onRatingChange,
    readonly = true,
  }: {
    rating: number
    onRatingChange?: (rating: number) => void
    readonly?: boolean
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange?.(star)}
          disabled={readonly}
          className={cn(
            "transition-colors",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default",
          )}
        >
          <Star className={cn("h-4 w-4", star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reviews & Ratings</span>
            <Badge variant="outline">{reviews.length} reviews</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
              <StarRating rating={Math.round(averageRating)} />
              <p className="text-gray-600 text-sm mt-2">Based on {reviews.length} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      {userCanReview && (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            {!showReviewForm ? (
              <Button onClick={() => setShowReviewForm(true)} className="w-full">
                Share Your Experience
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <StarRating
                    rating={newReview.rating}
                    onRatingChange={(rating) => setNewReview((prev) => ({ ...prev, rating }))}
                    readonly={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Review Title</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Summarize your experience..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Review</label>
                  <Textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Share details about your experience..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewForm(false)
                      setNewReview({ rating: 0, title: "", content: "" })
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
              <SelectItem value="rating">Highest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedAndFilteredReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{review.user.name}</h4>
                        {review.user.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <StarRating rating={review.rating} />
                        <span>•</span>
                        <span>{new Date(review.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{review.user.attendedEvents} events attended</span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Report Review
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h5 className="font-medium mb-2">{review.title}</h5>
                  <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(review.id, "helpful")}
                        className={cn(
                          "text-gray-600 hover:text-green-600",
                          review.userVote === "helpful" && "text-green-600 bg-green-50",
                        )}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {review.helpful}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(review.id, "not-helpful")}
                        className={cn(
                          "text-gray-600 hover:text-red-600",
                          review.userVote === "not-helpful" && "text-red-600 bg-red-50",
                        )}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {review.notHelpful}
                      </Button>
                    </div>

                    <span className="text-sm text-gray-500">Was this review helpful?</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedAndFilteredReviews.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">No reviews found</h3>
            <p className="text-gray-600">
              {filterRating !== "all"
                ? `No reviews with ${filterRating} stars found.`
                : "Be the first to review this event!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
