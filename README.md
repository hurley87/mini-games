# Mini Games Studio - Technical Documentation

![Mini Games Studio](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

**Mini Games Studio** enables users to create AI-generated web games and share them directly in Farcaster. Games can be tokenized using Zora Coins SDK, allowing communities to back their favorite game creators.

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

| Category           | Technology            | Purpose                                      |
| ------------------ | --------------------- | -------------------------------------------- |
| **Framework**      | Next.js 15            | Full-stack React framework with App Router   |
| **Language**       | TypeScript            | Type-safe development with strict mode       |
| **Styling**        | Tailwind CSS v4       | Utility-first CSS framework                  |
| **UI Components**  | Radix UI              | Accessible primitive components              |
| **Database**       | Supabase (PostgreSQL) | Backend-as-a-Service with real-time features |
| **Authentication** | Privy                 | Web3-native auth with Farcaster integration  |
| **AI**             | OpenAI GPT-4.1        | Game generation and iterative improvements   |
| **Blockchain**     | Zora Coins SDK        | Token creation and trading on Base           |
| **Storage**        | Pinata (IPFS)         | Decentralized file storage for game assets   |
| **Social**         | Neynar SDK            | Farcaster social features and user data      |

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

The application uses **Privy** for authentication with Farcaster:

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

Each tokenized game includes configurable parameters that creators can customize during token creation:

#### Creator-Configurable Parameters

| Parameter               | Range               | Description                                        |
| ----------------------- | ------------------- | -------------------------------------------------- |
| **Token Name & Symbol** | 3-6 chars           | User-defined branding for the game token           |
| **Game Duration**       | 0-60 seconds        | How long each game session lasts (0 = unlimited)   |
| **Maximum Points**      | 1-100 points        | Maximum points a player can earn per game          |
| **Token Multiplier**    | 1-1,000,000x        | Multiplier for converting points to tokens         |
| **Premium Threshold**   | 1-10,000,000 tokens | Minimum tokens held to play more than once per day |
| **Max Daily Plays**     | 1-100 plays         | Maximum games a player can play per day            |

#### Token Economics Flow

- **Basic Players**: Can play once per day for free
- **Token Holders**: Players holding ≥ `premium_threshold` tokens can play up to `max_plays` times daily
- **Reward Pool**: Dedicated wallet address that automatically pays out tokens based on player scores
- **Instant Payouts**: Players receive tokens immediately upon game completion

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

**🎮 Zora Integration**: The EIP-7572 metadata standard makes games **directly playable on Zora**. When users view the token on Zora's platform, they can play the game inline without leaving the site. The `animation_url` and `content.uri` fields point to the IPFS-hosted HTML game, enabling Zora to render the interactive experience directly within the token's metadata view.

### Token Configuration Interface

The **Token Dialog** (`src/components/token-dialog.tsx`) provides a user-friendly interface for creators to configure all tokenization parameters:

#### Configuration Process

1. **Launch Game**: Click "Launch Game" button on any completed build
2. **Token Branding**: Set token name and symbol (e.g., "Space Credits" / "SPACE")
3. **Game Parameters**: Configure gameplay and economic settings:

   - **Game Duration**: Slider for 0-60 second time limits
   - **Max Points**: Set scoring ceiling (1-100 points)
   - **Token Multiplier**: Define point-to-token conversion rate
   - **Premium Threshold**: Set token holding requirement for multiple daily plays
   - **Max Daily Plays**: Limit how many times premium users can play

4. **Deploy**: Creates token contract, reward pool wallet, and IPFS metadata
5. **Share**: Direct integration to share on Farcaster with embedded gameplay

#### Real-time Validation

The interface includes real-time validation ensuring:

- All parameters are within acceptable ranges
- Token symbols are 3-6 characters uppercase
- Configuration values are economically viable
- Game duration aligns with platform constraints

This configuration system allows creators to fine-tune their game's economy to match their community and monetization strategy.

## �📡 API Reference

### Build Management

| Endpoint                                        | Method | Description               |
| ----------------------------------------------- | ------ | ------------------------- |
| `/api/builds`                                   | GET    | List user's builds        |
| `/api/create-build`                             | POST   | Create new game build     |
| `/api/update-build`                             | POST   | Update existing build     |
| `/api/build-status`                             | GET    | Get build status and data |
| `/api/builds/[id]/title`                        | PUT    | Update build title        |
| `/api/builds/[id]/versions`                     | GET    | List build versions       |
| `/api/builds/[id]/versions/[versionId]`         | DELETE | Delete specific version   |
| `/api/builds/[id]/versions/[versionId]/restore` | POST   | Restore to version        |

### Token Management

| Endpoint                           | Method | Description               |
| ---------------------------------- | ------ | ------------------------- |
| `/api/coins/[buildId]`             | GET    | Get token data for build  |
| `/api/coins/[buildId]`             | POST   | Create token for build    |
| `/api/create-coin`                 | POST   | Initialize coin record    |
| `/api/coins/[buildId]/pool-status` | GET    | Check pool initialization |
| `/api/coins/[buildId]/unpublished` | GET    | Get unpublished coin data |

### AI & Chat

| Endpoint                                      | Method | Description              |
| --------------------------------------------- | ------ | ------------------------ |
| `/api/process-build.background`               | POST   | Background AI processing |
| `/api/threads`                                | POST   | Create new AI thread     |
| `/api/threads/[threadId]/messages`            | POST   | Send message to AI       |
| `/api/threads/[threadId]/runs/[runId]/cancel` | POST   | Cancel AI run            |

### User Management

| Endpoint          | Method | Description                   |
| ----------------- | ------ | ----------------------------- |
| `/api/creators`   | POST   | Create/update creator profile |
| `/api/save-score` | POST   | Save game score               |
| `/api/rpc-url`    | GET    | Get blockchain RPC URL        |

### Game Embedding

| Endpoint          | Method | Description          |
| ----------------- | ------ | -------------------- |
| `/api/embed/[id]` | GET    | Serve game in iframe |

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
- [AGENTS.md](./AGENTS.md) - Contributor guidelines and development standards
- [CLAUDE.md](./CLAUDE.md) - AI assistant guidance for code modifications

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Mini Games Studio** - Empowering creators to build tokenized games that can be played on Zora and Farcaster.
