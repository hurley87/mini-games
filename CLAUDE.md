# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mini Games Studio is a Next.js application that lets users build 30-second web games and share them in the Farcaster feed. Games are AI-generated and can be tokenized so communities can back their favorites.

## Development Commands

- `yarn dev` - Start development server
- `yarn build` - Build for production  
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Architecture

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives with custom components in `src/components/ui/`
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Privy (Farcaster integration)
- **AI**: OpenAI API for game generation
- **Blockchain**: Coinbase SDK, Zora Coins SDK for tokenization

### Directory Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (UI primitives in `ui/` subdirectory)
- `src/lib/` - Utilities and service modules
- `src/hooks/` - Custom React hooks
- `supabase/migrations/` - Database schema migrations

### Key Services
- **Supabase Client** (`src/lib/supabase.ts`) - Database operations for builds, creators, coins, and version control
- **OpenAI Integration** (`src/lib/openai.ts`) - AI-powered game generation
- **Neynar SDK** (`src/lib/neynar.ts`) - Farcaster social features
- **Pinata** (`src/lib/pinata.ts`) - IPFS file storage

### Data Models
- **Build** - Core game entity with HTML/JS content, linked to Farcaster threads
- **BuildVersion** - Version control system for iterative game development
- **Coin** - Tokenized games with reward mechanics
- **Creators** - Farcaster user profiles

### API Architecture
All API routes are in `src/app/api/` using Next.js App Router conventions:
- Build management (`/api/builds/`, `/api/create-build/`)
- Coin operations (`/api/coins/`, `/api/create-coin/`)
- OpenAI thread management (`/api/threads/`)
- Background processing (`/api/process-build.background/`)

## Development Guidelines

### Code Style
- Follow existing TypeScript patterns and component structure
- Use Tailwind CSS for styling with mobile-first responsive design
- Validate all inputs with Zod schemas
- Handle errors gracefully with proper user feedback
- Use descriptive variable names and keep components focused

### Database Operations
- Always use the helper functions in `src/lib/supabase.ts`
- Handle PGRST116 (no rows) errors appropriately
- Use atomic operations for version control via RPC functions

### Component Patterns
- UI components use Radix primitives with Tailwind styling
- Game rendering happens in isolated iframes for security
- Chat interface integrates with OpenAI assistants API
- Authentication state managed through Privy hooks

### Environment Variables Required
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEYNAR_API_KEY`
- Various Privy and Coinbase configuration keys