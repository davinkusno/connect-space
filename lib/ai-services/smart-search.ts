import { aiClient } from "../ai-client"
import { z } from "zod"

const SearchIntentSchema = z.object({
  intent: z.enum(["find_community", "find_event", "find_person", "get_information", "get_help"]),
  entities: z.array(
    z.object({
      type: z.enum(["location", "topic", "skill", "time", "person", "organization"]),
      value: z.string(),
      confidence: z.number(),
    }),
  ),
  filters: z.object({
    category: z.string().optional(),
    location: z.string().optional(),
    timeRange: z.string().optional(),
    priceRange: z.string().optional(),
    skillLevel: z.string().optional(),
  }),
  suggestedQueries: z.array(z.string()),
})

const SearchResultsSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["community", "event", "person", "post", "resource"]),
      title: z.string(),
      description: z.string(),
      relevanceScore: z.number(),
      matchedTerms: z.array(z.string()),
      category: z.string().optional(),
    }),
  ),
  totalCount: z.number(),
  facets: z.object({
    categories: z.array(z.object({ name: z.string(), count: z.number() })),
    locations: z.array(z.object({ name: z.string(), count: z.number() })),
    timeRanges: z.array(z.object({ name: z.string(), count: z.number() })),
  }),
})

export class SmartSearch {
  async analyzeSearchIntent(
    query: string,
    userContext?: {
      location?: string
      interests?: string[]
      recentSearches?: string[]
      memberCommunities?: string[]
    },
  ) {
    const prompt = `Analyze this search query and extract the user's intent, entities, and suggested filters: "${query}"
    
    User context:
    - Location: ${userContext?.location || "not specified"}
    - Interests: ${userContext?.interests?.join(", ") || "not specified"}
    - Recent searches: ${userContext?.recentSearches?.join(", ") || "none"}
    - Member communities: ${userContext?.memberCommunities?.join(", ") || "none"}
    
    Determine:
    1. Primary search intent
    2. Extract entities (locations, topics, skills, etc.)
    3. Suggest appropriate filters
    4. Provide alternative query suggestions`

    return aiClient.generateObject(query, SearchIntentSchema, {
      systemPrompt:
        "You are an expert search analyst who understands user intent and extracts meaningful entities from search queries to improve search results.",
    })
  }

  async enhanceSearchQuery(
    originalQuery: string,
    searchResults: any[],
    userFeedback?: {
      clickedResults?: string[]
      ignoredResults?: string[]
      refinedQuery?: string
    },
  ) {
    const prompt = `Improve this search query based on results and user behavior: "${originalQuery}"
    
    Search results summary: ${searchResults.length} results found
    User feedback:
    - Clicked results: ${userFeedback?.clickedResults?.join(", ") || "none"}
    - Ignored results: ${userFeedback?.ignoredResults?.join(", ") || "none"}
    - User refined to: ${userFeedback?.refinedQuery || "no refinement"}
    
    Suggest:
    1. Improved query variations
    2. Additional search terms
    3. Filter recommendations
    4. Alternative approaches`

    return aiClient.generateText(prompt, {
      systemPrompt:
        "You are a search optimization expert who helps users find exactly what they're looking for by improving their search queries.",
    })
  }

  async generateSearchSuggestions(
    partialQuery: string,
    userContext?: {
      location?: string
      interests?: string[]
      recentSearches?: string[]
    },
  ) {
    const prompt = `Generate 5-8 search suggestions for the partial query: "${partialQuery}"
    
    User context:
    - Location: ${userContext?.location || "not specified"}
    - Interests: ${userContext?.interests?.join(", ") || "not specified"}
    - Recent searches: ${userContext?.recentSearches?.join(", ") || "none"}
    
    Suggestions should be:
    - Relevant to the partial query
    - Personalized to user context
    - Diverse in scope (communities, events, people, topics)
    - Actionable and specific`

    return aiClient.generateText(prompt, {
      systemPrompt: "You are a search suggestion expert who provides helpful, relevant autocomplete suggestions.",
    })
  }

  async semanticSearch(
    query: string,
    documents: any[],
    options?: {
      threshold?: number
      maxResults?: number
      boostFactors?: Record<string, number>
    },
  ) {
    // This would typically use vector embeddings, but for this demo we'll use AI text analysis
    const prompt = `Rank these documents by relevance to the query: "${query}"
    
    Documents:
    ${documents.map((doc, i) => `${i + 1}. ${doc.title}: ${doc.description}`).join("\n")}
    
    Return a ranked list with relevance scores (0-1) and explanation of matches.`

    return aiClient.generateText(prompt, {
      systemPrompt:
        "You are a semantic search expert who understands context and meaning to find the most relevant results.",
    })
  }

  async explainSearchResults(query: string, results: any[]) {
    const prompt = `Explain why these search results were returned for the query: "${query}"
    
    Results:
    ${results
      .slice(0, 5)
      .map((result, i) => `${i + 1}. ${result.title}: ${result.description}`)
      .join("\n")}
    
    Provide:
    1. Why each result is relevant
    2. What terms/concepts matched
    3. Suggestions for refining the search
    4. Alternative search strategies`

    return aiClient.generateText(prompt, {
      systemPrompt:
        "You are a search explainer who helps users understand search results and how to improve their searches.",
    })
  }
}

export const smartSearch = new SmartSearch()
