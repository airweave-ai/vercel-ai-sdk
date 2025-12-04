# @airweave/vercel-ai-sdk

Airweave search tool for the [Vercel AI SDK](https://ai-sdk.dev). Search across all your synced data sources (Notion, Slack, Google Drive, databases, and 30+ more) in just a few lines of code.

## Installation

```bash
npm install @airweave/vercel-ai-sdk
```

## Quick Start

```typescript
import { generateText, gateway, stepCountIs } from 'ai';
import { airweaveSearch } from '@airweave/vercel-ai-sdk';

const { text } = await generateText({
  model: gateway('anthropic/claude-sonnet-4.5'),
  prompt: 'What were the key decisions from last week?',
  tools: {
    search: airweaveSearch({
      defaultCollection: 'my-knowledge-base',
    }),
  },
  stopWhen: stepCountIs(3),
});

console.log(text);
```

## Configuration

```typescript
airweaveSearch({
  // API key (defaults to AIRWEAVE_API_KEY env var)
  apiKey: 'your-api-key',
  
  // Default collection to search
  defaultCollection: 'my-collection',
  
  // Max results per search (default: 10)
  defaultLimit: 20,
  
  // Generate AI answer from results (default: false)
  generateAnswer: true,
  
  // Query expansion for better recall (default: true)
  expandQuery: true,
  
  // Rerank for relevance (default: true)
  rerank: true,
  
  // Base URL for self-hosted instances
  baseUrl: 'https://your-instance.airweave.ai',
});
```

## Environment Variables

- `AIRWEAVE_API_KEY` - Your Airweave API key

Get your API key at [app.airweave.ai/settings/api-keys](https://app.airweave.ai/settings/api-keys)

## Features

- **Unified Search** - Search across 35+ connected data sources with one API
- **Semantic Search** - AI-powered search that understands meaning, not just keywords
- **Query Expansion** - Automatically expands queries for better recall
- **Reranking** - ML-based reranking for improved relevance
- **AI Answers** - Optional AI-generated answers from search results

## TypeScript Support

Full TypeScript types included:

```typescript
import { 
  airweaveSearch, 
  AirweaveSearchOptions, 
  AirweaveSearchResult,
  AirweaveSearchResultItem 
} from '@airweave/vercel-ai-sdk';

const config: AirweaveSearchOptions = {
  defaultCollection: 'my-collection',
  defaultLimit: 10,
};

const search = airweaveSearch(config);

// Result types
interface AirweaveSearchResultItem {
  id: string;                    // Entity ID
  score: number;                 // Relevance score
  payload: {
    entity_id?: string;
    name?: string;
    created_at?: string;
    textual_representation?: string;
    airweave_system_metadata?: {
      source_name?: string;      // e.g., "notion", "slack"
      entity_type?: string;      // e.g., "NotionPageEntity"
    };
    // Plus source-specific fields
  };
}
```

## Documentation

- [Airweave Docs](https://docs.airweave.ai)
- [Vercel AI SDK Docs](https://ai-sdk.dev)

## License

MIT
