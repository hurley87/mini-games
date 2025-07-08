# Mini Games Studio - Technical Documentation

![Mini Games Studio](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

**Mini Games Studio** is a Next.js application that enables users to create AI-generated 30-second web games and share them directly in the Farcaster social feed. Games can be tokenized using Zora Coins SDK, allowing communities to back their favorite creators with cryptocurrency rewards.

## 🚀 Quick Start

1. **Authentication**: Sign in with your Farcaster account (requires Neynar score ≥ 0.7)
2. **Create**: Describe your game idea and let AI generate the initial version
3. **Iterate**: Use the chat interface to refine gameplay mechanics
4. **Tokenize**: Publish with token rewards for player engagement
5. **Share**: Deploy to Farcaster feed as an embedded mini-app

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Core Technologies](#-core-technologies)
- [System Architecture](#-system-architecture)
- [Authentication System](#-authentication-system)
- [AI Game Generation](#-ai-game-generation)
- [Tokenization System](#-tokenization-system)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Development Setup](#-development-setup)
- [Key Components](#-key-components)
- [Security Considerations](#-security-considerations)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)

## 🏗️ Architecture Overview

Mini Games Studio follows a modern full-stack architecture built on Next.js 15 with App Router, integrating multiple external services for authentication, AI generation, blockchain interactions, and decentralized storage.

### Core Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 15 | Full-stack React framework with App Router |
| **Language** | TypeScript | Type-safe development with strict mode |
| **Styling** | Tailwind CSS v4 | Utility-first CSS framework |
| **UI Components** | Radix UI | Accessible primitive components |
| **Database** | Supabase (PostgreSQL) | Backend-as-a-Service with real-time features |
| **Authentication** | Privy | Web3-native auth with Farcaster integration |
| **AI** | OpenAI GPT-4.1 | Game generation and iterative improvements |
| **Blockchain** | Zora Coins SDK | Token creation and trading on Base |
| **Storage** | Pinata (IPFS) | Decentralized file storage for game assets |
| **Social** | Neynar SDK | Farcaster social features and user data |


### Key Features

- **AI-Powered Game Generation**: GPT-4.1 creates complete HTML/CSS/JS games from natural language descriptions
- **Real-time Iteration**: Chat-based interface for refining game mechanics and visuals
- **Version Control**: Automatic versioning system with restore/rollback capabilities
- **Token Economics**: ERC-20 token creation with configurable reward mechanics
- **Farcaster Integration**: Native sharing and embedded gameplay in social feeds
- **Sandboxed Execution**: Secure iframe-based game rendering with score tracking
- **IPFS Metadata**: EIP-7572 compliant token metadata stored on decentralized network

## 🔐 Authentication System

### Privy Integration

The application uses **Privy** for Web3-native authentication with exclusive Farcaster login:

```typescript
// src/app/providers.tsx
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
  config={{
    loginMethods: ['farcaster'],
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      showWalletUIs: false,
    },
  }}
>
```

### Access Control

1. **Whitelist System**: Only approved Farcaster usernames can access the platform
2. **Neynar Score Gate**: Minimum score of 0.7 required for game creation
3. **Build Ownership**: Users can only edit games they created
4. **FID Authentication**: Farcaster ID (FID) used for all user identification

### Authentication Flow

```typescript
// Authentication check in components
const { authenticated, ready, user } = usePrivy();
const userFid = user?.farcaster?.fid;
const username = user?.farcaster?.username;
```

## 🤖 AI Game Generation

### OpenAI Integration

The system uses **GPT-4.1** with structured output for consistent game generation:

```typescript
// Core generation prompt system
const { object: agentResponse } = await generateObject({
  model: openai(model),
  schema: buildSchema,
  mode: 'json',
  system: getSystemPrompt(),
  prompt: getActionPrompt(description),
});
```

### Game Generation Pipeline

1. **Initial Creation** (`/api/create-build`):
   - Validates user eligibility (Neynar score ≥ 0.7)
   - Creates database record with "pending" status
   - Triggers background processing

2. **Background Processing** (`/api/process-build.background`):
   - Generates game code using structured AI prompts
   - Creates OpenAI assistant thread for future iterations
   - Generates preview image using DALL-E 3
   - Updates build status to "completed"

3. **Iterative Improvements** (`/api/threads/[threadId]/messages`):
   - Uses OpenAI's **Assistants SDK** for conversational game updates
   - Each thread functions like a persistent ChatGPT conversation
   - Maintains full context of all previous modifications and user requests
   - Streams real-time responses from the AI assistant
   - Calls `update_game` function tool with complete updated HTML


### OpenAI Assistants Integration

The game update system leverages **OpenAI's Assistants SDK** to provide intelligent, context-aware modifications:

```typescript
// Creating persistent conversation thread
const thread = await openai.beta.threads.create();

// Each message maintains conversation history
const stream = openai.beta.threads.runs.stream(threadId, {
  assistant_id: assistantId,
  instructions: `You are an interactive game editor assistant...`,
});
```

**Key Benefits:**
- **Conversation Memory**: AI remembers all previous changes and user feedback
- **Context Awareness**: Understands the current game state and user's intent
- **Natural Iteration**: Users can make requests like "make it harder" or "change the colors to blue"
- **Cumulative Improvements**: Each modification builds upon previous changes
- **Intelligent Suggestions**: AI can propose improvements based on conversation history

**Example Conversation Flow:**
1. User: "Make the game easier"
2. AI: Updates difficulty parameters, remembers this preference
3. User: "Add particle effects"
4. AI: Adds effects while maintaining the easier difficulty from step 1
5. User: "Make the background darker but keep everything else"
6. AI: Only modifies background, preserving all previous improvements

This threading system enables a natural, conversational approach to game development where each modification is informed by the complete context of the user's creative process.


### Game Constraints

- **Duration**: 0-60 seconds (0 = unlimited)
- **Display**: 400×750px mobile-optimized canvas
- **Scoring**: 1-100 points maximum
- **Input**: Mouse/tap only (no keyboard/gestures)
- **Environment**: Sandboxed iframe, no external dependencies
- **UI Requirements**: No visible text, scores, or timers

### Scoring System Integration

Games communicate with the parent window through predefined functions:

```javascript
// Available in game environment
function tryUpdateScore(score) {
  if (typeof window.updateScore === 'function') {
    window.updateScore(score);
  }
}

function tryAwardPoints(score) {
  if (typeof window.awardPoints === 'function') {
    window.awardPoints(score);
  }
}
```

## 💰 Tokenization System

### Zora Coins SDK Integration

The platform creates ERC-20 tokens on Base network using Zora's Coins protocol:

```typescript
// Token creation with Zora SDK
const { address: coinAddress } = await createCoin({
  publicClient,
  walletClient,
  deployCurrency,
  account,
});
```

### Token Economics

Each tokenized game includes:

- **Token Name & Symbol**: User-defined branding
- **Reward Pool**: Dedicated wallet for player payouts
- **Token Multiplier**: Points → Token conversion rate
- **Premium Threshold**: Minimum token balance for enhanced rewards
- **Play Limits**: Maximum plays per user per session

### Reward Formula

```
Tokens Earned = Player Score × Token Multiplier
Example: 25 points × 1,000 multiplier = 25,000 tokens
```

### EIP-7572 Metadata

Games generate compliant metadata stored on IPFS:

```json
{
  "version": "eip-7572",
  "name": "Game Name",
  "description": "Mini Game created by @username on Farcaster",
  "image": "ipfs://...",
  "animation_url": "ipfs://...",
  "content": {
    "mime": "text/html",
    "uri": "ipfs://..."
  },
  "properties": {
    "category": "game"
  }
}
```

## 🗄️ Database Schema

### Core Tables

#### builds
```sql
CREATE TABLE builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  html TEXT NOT NULL,
  description TEXT,
  model TEXT,
  fid BIGINT NOT NULL,
  thread_id TEXT,
  image TEXT,
  tutorial TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### build_versions
```sql
CREATE TABLE build_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_fid BIGINT NOT NULL,
  description TEXT DEFAULT '',
  UNIQUE(build_id, version_number)
);
```

#### creators
```sql
CREATE TABLE creators (
  fid BIGINT PRIMARY KEY,
  username TEXT NOT NULL,
  pfp TEXT,
  bio TEXT,
  primary_address TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  power_badge BOOLEAN DEFAULT FALSE,
  score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### coins
```sql
CREATE TABLE coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  coin_address TEXT NOT NULL,
  build_id UUID NOT NULL REFERENCES builds(id),
  fid BIGINT NOT NULL,
  image TEXT,
  wallet_address TEXT,
  wallet_id TEXT,
  chain_type TEXT DEFAULT 'ethereum',
  pool_initialized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Version Control System

The application implements automatic version control for all build modifications:

- **Automatic Versioning**: Creates versions on every build update
- **Atomic Operations**: Uses PostgreSQL RPC functions for consistency
- **Restore Capability**: Revert to any previous version
- **Version Cleanup**: Users can delete unnecessary versions

## 📡 API Reference

### Build Management

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/builds` | GET | List user's builds |
| `/api/create-build` | POST | Create new game build |
| `/api/update-build` | POST | Update existing build |
| `/api/build-status` | GET | Get build status and data |
| `/api/builds/[id]/title` | PUT | Update build title |
| `/api/builds/[id]/versions` | GET | List build versions |
| `/api/builds/[id]/versions/[versionId]` | DELETE | Delete specific version |
| `/api/builds/[id]/versions/[versionId]/restore` | POST | Restore to version |

### Token Management

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/coins/[buildId]` | GET | Get token data for build |
| `/api/coins/[buildId]` | POST | Create token for build |
| `/api/create-coin` | POST | Initialize coin record |
| `/api/coins/[buildId]/pool-status` | GET | Check pool initialization |
| `/api/coins/[buildId]/unpublished` | GET | Get unpublished coin data |

### AI & Chat

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/process-build.background` | POST | Background AI processing |
| `/api/threads` | POST | Create new AI thread |
| `/api/threads/[threadId]/messages` | POST | Send message to AI |
| `/api/threads/[threadId]/runs/[runId]/cancel` | POST | Cancel AI run |

### User Management

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/creators` | POST | Create/update creator profile |
| `/api/save-score` | POST | Save game score |
| `/api/rpc-url` | GET | Get blockchain RPC URL |

### Game Embedding

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/embed/[id]` | GET | Serve game in iframe |

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ 
- **npm/yarn** package manager
- **Supabase** project with PostgreSQL database
- **OpenAI** API key with GPT-4 access
- **Privy** account for Web3 authentication
- **Neynar** API key for Farcaster integration
- **Pinata** account for IPFS storage
- **Base network** RPC access for blockchain interactions

### Installation

```bash
# Clone repository
git clone <repository-url>
cd website

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
# (Connect to your Supabase project first)

# Start development server
yarn dev
```

### Scripts

```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
```

### Environment Setup

Create `.env.local` with required variables (see [Environment Variables](#environment-variables) section).

## 🧩 Key Components

### Client Components

#### Game Renderer (`src/components/game/game-renderer.tsx`)
- Renders games in secure sandboxed iframes
- Handles loading states and user authentication
- Manages score communication between game and parent

#### Chat Interface (`src/components/chat.tsx`)
- Real-time streaming AI responses
- Handles tool calls for game updates
- Manages conversation state and error handling

#### Token Dialog (`src/components/token-dialog.tsx`)
- Token creation and configuration interface
- Real-time balance checking and transaction handling
- Integrates with Zora Coins SDK for minting

#### Build List (`src/components/build-list.tsx`)
- Displays user's games with status indicators
- Handles different build states (pending, generating, completed, failed)
- Integrates with build context for real-time updates

### Server Components

#### Authentication (`src/components/whitelist-check.tsx`)
- Validates user access based on whitelist
- Integrates with Privy authentication state
- Provides fallback UI for unauthorized users

#### Build Owner Check (`src/components/build-owner-check.tsx`)
- Ensures only build creators can edit their games
- Handles ownership validation and redirects
- Protects sensitive build operations

### Utility Libraries

#### Supabase Client (`src/lib/supabase.ts`)
- Database operations and file storage
- Type-safe database helpers
- Image upload and URL generation

#### IPFS Service (`src/lib/pinata.ts`)
- Pinata integration for decentralized storage
- Game metadata and asset management
- EIP-7572 compliant metadata generation

#### Build Context (`src/lib/build-context.tsx`)
- React context for build state management
- Real-time build updates and optimistic UI
- Centralized build operations

## 🔒 Security Considerations

### Input Validation

- **Zod Schemas**: All API inputs validated with TypeScript schemas
- **HTML Sanitization**: Game HTML validated for security compliance
- **User Authentication**: FID-based ownership verification for all operations

### Sandboxing

- **iframe Sandbox**: Games run in restricted iframe environment
- **No External Dependencies**: Generated games cannot access external resources
- **Limited DOM Access**: Games cannot manipulate parent window

### API Security

- **Authentication Gates**: All protected endpoints verify user identity
- **Rate Limiting**: Background processing includes retry logic with limits
- **Error Handling**: Sanitized error responses prevent information leakage

### Blockchain Security

- **Private Key Management**: Server-side key storage for token operations
- **Transaction Validation**: All blockchain interactions validated before execution
- **Wallet Isolation**: Each token gets dedicated wallet for security

## 🚀 Deployment

### Platform Requirements

- **Vercel/Netlify**: Recommended for Next.js deployment
- **Node.js 18+**: Runtime requirement
- **PostgreSQL**: Database with Supabase or self-hosted
- **IPFS Gateway**: Pinata or alternative IPFS service

### Build Configuration

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
};
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] CORS settings configured for domain
- [ ] API rate limits configured
- [ ] Monitoring and analytics setup
- [ ] Backup strategy implemented

## 🔧 Environment Variables

### Required Variables

```bash
# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Blockchain
PRIVATE_KEY=your_ethereum_private_key
RPC_URL=your_base_network_rpc_url

# Social Integration
NEYNAR_API_KEY=your_neynar_api_key

# IPFS Storage
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Application
NEXT_PUBLIC_APP_URL=your_deployed_app_url
```

### Optional Variables

```bash
# Development
NODE_ENV=development
NEXT_PUBLIC_ENABLE_LOGGING=true

# Analytics
ANALYTICS_ID=your_analytics_id
```

## 📖 Additional Documentation

- [Creator Docs](/docs) - User guide for game creation and tokenization
- [VERSION_CONTROL.md](./VERSION_CONTROL.md) - Detailed version control system documentation
- [AGENTS.md](./AGENTS.md) - Contributor guidelines and development standards
- [CLAUDE.md](./CLAUDE.md) - AI assistant guidance for code modifications

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow coding standards** outlined in AGENTS.md
4. **Add comprehensive tests** for new functionality
5. **Update documentation** as needed
6. **Submit pull request** with detailed description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Mini Games Studio** - Empowering creators to build, tokenize, and share games in the decentralized social web.