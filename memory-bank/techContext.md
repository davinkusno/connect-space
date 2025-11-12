# Technical Context

## Technology Stack

### Frontend

- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Next Themes** - Theme management

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email/password, Google OAuth)
  - Real-time subscriptions
  - Row Level Security (RLS)
- **Next.js API Routes** - Server-side API endpoints

### AI & Machine Learning

- **GitHub Models** - Free AI models via GitHub API (GPT-4o)
- **AI SDK** - Unified AI interface
- **Custom AI Services**:
  - Content generation and enhancement
  - Recommendation engine
  - Chatbot functionality
  - Content moderation
  - Daily summary generation

### Caching & Performance

- **Upstash Redis** - Caching and rate limiting
- **Next.js Image Optimization** - Automatic image optimization
- **Code Splitting** - Automatic bundle optimization

### Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **pnpm** - Package management

## Development Setup

### Prerequisites

- Node.js (latest LTS)
- pnpm package manager
- Supabase account and project
- GitHub Personal Access Token (for GitHub Models API)

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services - GitHub Models
GITHUB_MODELS_API_KEY=your_github_personal_access_token
# Alternative: GITHUB_PERSONAL_ACCESS_TOKEN (also supported)

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Database Schema

- Users and authentication
- Communities and memberships
- Events and attendees
- Messages and conversations
- Recommendations and feedback
- Badges and achievements

## Deployment Considerations

- **Vercel** - Recommended hosting platform
- **Supabase** - Database and auth hosting
- **Upstash** - Redis hosting
- **Environment-specific configurations**

## Security Measures

- Row Level Security (RLS) in Supabase
- API rate limiting with Redis
- Input validation and sanitization
- Secure authentication flows
- CORS configuration
- Content moderation with AI

## Performance Optimizations

- Server-side rendering (SSR)
- Static site generation (SSG) where appropriate
- Image optimization and lazy loading
- Database query optimization
- Caching strategies
- Bundle size optimization

## Monitoring & Analytics

- Built-in Next.js analytics
- Supabase dashboard for database metrics
- Error tracking and logging
- Performance monitoring
- User engagement metrics
