import { tool } from 'ai';
import { z } from 'zod';
import { AirweaveSDKClient } from '@airweave/sdk';

/**
 * Configuration options for the Airweave search tool.
 */
export interface AirweaveSearchOptions {
  /**
   * Airweave API key. Defaults to AIRWEAVE_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Base URL for self-hosted Airweave instances.
   */
  baseUrl?: string;

  /**
   * Default collection readable ID to search.
   * Can be overridden per-query.
   */
  defaultCollection?: string;

  /**
   * Default maximum number of results. Default: 10
   */
  defaultLimit?: number;

  /**
   * Generate an AI-powered answer from search results.
   * Default: false
   */
  generateAnswer?: boolean;

  /**
   * Expand query with variations for better recall.
   * Default: true
   */
  expandQuery?: boolean;

  /**
   * Rerank results for improved relevance.
   * Default: true
   */
  rerank?: boolean;
}

/**
 * System metadata attached to each search result.
 */
export interface AirweaveSystemMetadata {
  source_name?: string;
  entity_type?: string;
  sync_id?: string;
  chunk_index?: number;
  db_entity_id?: string;
  db_created_at?: string;
  db_updated_at?: string;
}

/**
 * Breadcrumb for navigation context.
 */
export interface AirweaveBreadcrumb {
  entity_id: string;
  name: string;
  entity_type: string;
}

/**
 * A single search result item from Airweave.
 */
export interface AirweaveSearchResultItem {
  /** Unique identifier for this result */
  id: string;
  /** Relevance score (higher is better) */
  score: number;
  /** The entity data */
  payload: {
    entity_id?: string;
    name?: string;
    created_at?: string;
    updated_at?: string;
    breadcrumbs?: AirweaveBreadcrumb[];
    textual_representation?: string;
    airweave_system_metadata?: AirweaveSystemMetadata;
    /** Additional source-specific fields */
    [key: string]: unknown;
  };
}

/**
 * Search response from Airweave.
 */
export interface AirweaveSearchResult {
  /** Array of search results */
  results: AirweaveSearchResultItem[];
  /** AI-generated answer (when generateAnswer is true) */
  answer?: string;
}

/**
 * Creates an Airweave search tool for the Vercel AI SDK.
 *
 * @example
 * ```typescript
 * import { generateText, gateway, stepCountIs } from 'ai';
 * import { airweaveSearch } from '@airweave/vercel-ai-sdk';
 *
 * const { text } = await generateText({
 *   model: gateway('anthropic/claude-sonnet-4.5'),
 *   prompt: 'What were the key decisions from last week?',
 *   tools: {
 *     search: airweaveSearch({
 *       defaultCollection: 'my-knowledge-base',
 *     }),
 *   },
 *   stopWhen: stepCountIs(3),
 * });
 * ```
 */
export function airweaveSearch(options: AirweaveSearchOptions = {}) {
  const {
    apiKey = process.env.AIRWEAVE_API_KEY,
    baseUrl,
    defaultCollection,
    defaultLimit = 10,
    generateAnswer = false,
    expandQuery = true,
    rerank = true,
  } = options;

  if (!apiKey) {
    throw new Error(
      'Airweave API key is required. Set AIRWEAVE_API_KEY environment variable or pass apiKey option.'
    );
  }

  const client = new AirweaveSDKClient({
    apiKey,
    ...(baseUrl && { baseUrl }),
    frameworkName: 'vercel-ai-sdk',
    frameworkVersion: '1.0.0',
  });

  return tool({
    description:
      'Search across your synced data sources (Notion, Slack, Google Drive, databases, 35+ apps) using Airweave semantic search.',
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .max(1000)
        .describe('The search query to find relevant documents and data'),
      collection: z
        .string()
        .optional()
        .describe(
          'The collection readable ID to search. Uses default if not specified.'
        ),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe('Maximum number of results to return'),
    }),
    execute: async ({ query, collection, limit }) => {
      const collectionId = collection ?? defaultCollection;

      if (!collectionId) {
        throw new Error(
          'Collection is required. Pass collection in the query or set defaultCollection option.'
        );
      }

      const response = await client.collections.search(collectionId, {
        query,
        limit: limit ?? defaultLimit,
        generate_answer: generateAnswer,
        expand_query: expandQuery,
        rerank,
      });

      return {
        results: response.results as unknown as AirweaveSearchResultItem[],
        ...(response.completion && { answer: response.completion }),
      };
    },
  });
}

