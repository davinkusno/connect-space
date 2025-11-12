# System Patterns

## Architecture Overview

ConnectSpace follows a modern Next.js architecture with the following key patterns:

### Frontend Architecture

- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling with custom design system
- **Radix UI** components for accessibility
- **Lucide React** for consistent iconography

### Backend Architecture

- **Next.js API Routes** for backend functionality
- **Supabase** for database and authentication
- **AI SDK** integration for OpenAI and Anthropic
- **Upstash Redis** for caching and rate limiting

## Key Design Patterns

### 1. Component Composition

- Reusable UI components in `/components/ui/`
- Feature-specific components in `/components/[feature]/`
- Consistent component patterns across the application

### 2. AI Integration Pattern

- Centralized AI services in `/lib/ai-services/`
- Consistent API patterns for AI endpoints
- Error handling and fallback mechanisms

### 3. Authentication Flow

- Supabase Auth with Next.js middleware
- Server-side and client-side auth helpers
- Protected route patterns

### 4. Data Management

- Supabase client for database operations
- Type-safe database helpers
- Consistent error handling patterns

### 5. Real-time Features

- WebSocket connections for chat
- Real-time notifications
- Live updates for community activities

## File Organization Patterns

### API Routes

```
app/api/
├── ai/           # AI-powered endpoints
├── chat/         # Real-time chat
├── communities/  # Community management
├── recommendations/ # AI recommendations
└── daily-summary/  # Daily summaries
```

### Components Structure

```
components/
├── ui/           # Reusable UI components
├── [feature]/    # Feature-specific components
└── navigation/   # Navigation components
```

### Services Layer

```
lib/
├── ai-services/     # AI service implementations
├── supabase/        # Database and auth helpers
├── recommendation-engine/ # Recommendation algorithms
└── actions/         # Server actions
```

## State Management Patterns

- React Context for global state (WishlistProvider)
- Local state for component-specific data
- Server state management through Supabase
- Real-time state updates via WebSocket connections

## Error Handling Patterns

- Consistent error boundaries
- API error responses with proper HTTP status codes
- User-friendly error messages
- Fallback UI components for loading states

## Performance Patterns

- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Caching strategies with Redis
- Optimistic updates for better UX
