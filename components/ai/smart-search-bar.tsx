"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Sparkles, MapPin, Calendar, Users, Tag, TrendingUp, Clock, Filter, X, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface SmartSearchBarProps {
  onSearch?: (query: string, filters?: any) => void
  onSuggestionSelect?: (suggestion: any) => void
  placeholder?: string
  className?: string
  showFilters?: boolean
  userContext?: {
    location?: string
    interests?: string[]
    recentSearches?: string[]
  }
}

interface SearchSuggestion {
  id: string
  text: string
  type: "query" | "filter" | "entity"
  category?: string
  icon?: any
  metadata?: any
}

interface SearchIntent {
  intent: string
  entities: Array<{
    type: string
    value: string
    confidence: number
  }>
  filters: Record<string, any>
  suggestedQueries: string[]
}

export function SmartSearchBar({
  onSearch,
  onSuggestionSelect,
  placeholder = "Search communities, events, people...",
  className,
  showFilters = true,
  userContext,
}: SmartSearchBarProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [searchIntent, setSearchIntent] = useState<SearchIntent | null>(null)
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({})
  const [recentSearches] = useState(userContext?.recentSearches || [])

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Generate suggestions based on query
  useEffect(() => {
    if (query.length > 1) {
      generateSuggestions(query)
    } else {
      setSuggestions(getDefaultSuggestions())
    }
  }, [query])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getDefaultSuggestions = (): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = []

    // Recent searches
    if (recentSearches.length > 0) {
      suggestions.push(
        ...recentSearches.slice(0, 3).map((search, index) => ({
          id: `recent-${index}`,
          text: search,
          type: "query" as const,
          category: "Recent",
          icon: Clock,
        })),
      )
    }

    // Popular searches based on user context
    const popularSearches = [
      { text: "tech meetups near me", icon: MapPin, category: "Popular" },
      { text: "upcoming events this week", icon: Calendar, category: "Popular" },
      { text: "beginner-friendly communities", icon: Users, category: "Popular" },
      { text: "AI and machine learning", icon: Tag, category: "Trending" },
      { text: "startup networking", icon: TrendingUp, category: "Trending" },
    ]

    // Filter based on user interests
    const relevantSearches = userContext?.interests
      ? popularSearches.filter((search) =>
          userContext.interests!.some((interest) => search.text.toLowerCase().includes(interest.toLowerCase())),
        )
      : popularSearches.slice(0, 3)

    suggestions.push(
      ...relevantSearches.map((search, index) => ({
        id: `popular-${index}`,
        text: search.text,
        type: "query" as const,
        category: search.category,
        icon: search.icon,
      })),
    )

    return suggestions
  }

  const generateSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch("/api/ai/search-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          userContext,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const aiSuggestions: SearchSuggestion[] = data.suggestions.map((suggestion: string, index: number) => ({
          id: `ai-${index}`,
          text: suggestion,
          type: "query" as const,
          category: "AI Suggested",
          icon: Sparkles,
        }))

        setSuggestions(aiSuggestions)
      }
    } catch (error) {
      console.error("Failed to generate AI suggestions:", error)
      // Fallback to basic suggestions
      setSuggestions(getBasicSuggestions(searchQuery))
    }
  }

  const getBasicSuggestions = (searchQuery: string): SearchSuggestion[] => {
    const basicSuggestions = [
      `${searchQuery} communities`,
      `${searchQuery} events`,
      `${searchQuery} near me`,
      `${searchQuery} online`,
      `${searchQuery} beginner`,
    ]

    return basicSuggestions.map((suggestion, index) => ({
      id: `basic-${index}`,
      text: suggestion,
      type: "query" as const,
      category: "Suggestions",
      icon: Search,
    }))
  }

  const analyzeSearchIntent = async (searchQuery: string) => {
    if (searchQuery.length < 3) return

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/ai/analyze-search-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          userContext,
        }),
      })

      if (response.ok) {
        const intent = await response.json()
        setSearchIntent(intent)

        // Auto-apply suggested filters
        if (intent.filters && Object.keys(intent.filters).length > 0) {
          setAppliedFilters((prev) => ({ ...prev, ...intent.filters }))
        }
      }
    } catch (error) {
      console.error("Failed to analyze search intent:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (!finalQuery.trim()) return

    // Analyze intent for better results
    analyzeSearchIntent(finalQuery)

    // Perform search
    onSearch?.(finalQuery, appliedFilters)
    setShowSuggestions(false)

    // Add to recent searches
    if (!recentSearches.includes(finalQuery)) {
      recentSearches.unshift(finalQuery)
      if (recentSearches.length > 5) {
        recentSearches.pop()
      }
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setShowSuggestions(false)
    onSuggestionSelect?.(suggestion)
    handleSearch(suggestion.text)
  }

  const handleFilterAdd = (filterType: string, value: string) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  const handleFilterRemove = (filterType: string) => {
    setAppliedFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[filterType]
      return newFilters
    })
  }

  const getIconForCategory = (category: string) => {
    switch (category) {
      case "Recent":
        return Clock
      case "Popular":
        return TrendingUp
      case "Trending":
        return TrendingUp
      case "AI Suggested":
        return Sparkles
      case "Suggestions":
        return Search
      default:
        return Search
    }
  }

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {isAnalyzing ? (
            <Sparkles className="h-4 w-4 animate-pulse text-purple-500" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch()
            } else if (e.key === "Escape") {
              setShowSuggestions(false)
            }
          }}
          className="pl-10 pr-12 h-12 text-lg border-2 border-gray-200 focus:border-purple-400 rounded-xl bg-white/50 backdrop-blur-sm"
        />

        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery("")}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <Button
          onClick={() => handleSearch()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Applied Filters */}
      {Object.keys(appliedFilters).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(appliedFilters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="flex items-center gap-1 px-2 py-1">
              <Filter className="h-3 w-3" />
              {key}: {value}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterRemove(key)}
                className="h-4 w-4 p-0 ml-1 hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Intent Display */}
      {searchIntent && (
        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              AI detected intent: {searchIntent.intent.replace("_", " ")}
            </span>
          </div>

          {searchIntent.entities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {searchIntent.entities.map((entity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {entity.type}: {entity.value}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Card
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl border-0 max-h-80 overflow-y-auto"
        >
          <CardContent className="p-0">
            {suggestions.length > 0 ? (
              <div>
                {/* Group suggestions by category */}
                {Object.entries(
                  suggestions.reduce(
                    (groups, suggestion) => {
                      const category = suggestion.category || "Other"
                      if (!groups[category]) groups[category] = []
                      groups[category].push(suggestion)
                      return groups
                    },
                    {} as Record<string, SearchSuggestion[]>,
                  ),
                ).map(([category, categorySuggestions], categoryIndex) => (
                  <div key={category}>
                    {categoryIndex > 0 && <Separator />}

                    <div className="p-3 border-b border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{category}</h4>
                    </div>

                    {categorySuggestions.map((suggestion) => {
                      const IconComponent = suggestion.icon || getIconForCategory(category)
                      return (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full p-3 text-left hover:bg-purple-50 transition-colors duration-200 border-b border-gray-50 last:border-b-0 flex items-center gap-3"
                        >
                          <IconComponent className="h-4 w-4 text-gray-400" />
                          <span className="flex-1 text-sm text-gray-900">{suggestion.text}</span>
                          {suggestion.category === "AI Suggested" && <Sparkles className="h-3 w-3 text-purple-500" />}
                        </button>
                      )
                    })}
                  </div>
                ))}

                {/* Smart Query Suggestions */}
                {searchIntent?.suggestedQueries && searchIntent.suggestedQueries.length > 0 && (
                  <div>
                    <Separator />
                    <div className="p-3 border-b border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Suggestions
                      </h4>
                    </div>
                    {searchIntent.suggestedQueries.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={`ai-suggestion-${index}`}
                        onClick={() =>
                          handleSuggestionClick({
                            id: `ai-suggestion-${index}`,
                            text: suggestion,
                            type: "query",
                            category: "AI Suggested",
                            icon: Sparkles,
                          })
                        }
                        className="w-full p-3 text-left hover:bg-purple-50 transition-colors duration-200 border-b border-gray-50 last:border-b-0 flex items-center gap-3"
                      >
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <span className="flex-1 text-sm text-gray-900">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Start typing to see suggestions</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
