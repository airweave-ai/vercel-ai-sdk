/**
 * E2E test for Airweave + Vercel AI SDK integration
 * 
 * Prerequisites:
 *   - AIRWEAVE_API_KEY: Your Airweave API key
 *   - OPENAI_API_KEY: OpenAI API key (or use another provider)
 *   - A collection with data in Airweave
 * 
 * Usage:
 *   AIRWEAVE_API_KEY=xxx OPENAI_API_KEY=xxx npx tsx tests/e2e.ts
 * 
 * Optional env vars:
 *   - AIRWEAVE_COLLECTION: Collection readable ID (default: prompts user)
 *   - AIRWEAVE_BASE_URL: For self-hosted instances
 */

import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { airweaveSearch } from '../src/index.js';

// Check required env vars
const requiredEnvVars = ['AIRWEAVE_API_KEY', 'OPENAI_API_KEY'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('\nUsage:');
  console.error('  AIRWEAVE_API_KEY=xxx OPENAI_API_KEY=xxx npx tsx tests/e2e.ts');
  process.exit(1);
}

const COLLECTION = process.env.AIRWEAVE_COLLECTION;
if (!COLLECTION) {
  console.error('❌ Missing AIRWEAVE_COLLECTION environment variable');
  console.error('\nUsage:');
  console.error('  AIRWEAVE_API_KEY=xxx OPENAI_API_KEY=xxx AIRWEAVE_COLLECTION=my-collection npx tsx tests/e2e.ts');
  process.exit(1);
}

async function runTests() {
  console.log('🧪 Running Airweave + Vercel AI SDK E2E Tests\n');
  console.log(`Collection: ${COLLECTION}`);
  console.log(`Base URL: ${process.env.AIRWEAVE_BASE_URL || 'https://api.airweave.ai (default)'}\n`);

  // Create the search tool
  const search = airweaveSearch({
    defaultCollection: COLLECTION,
    ...(process.env.AIRWEAVE_BASE_URL && { baseUrl: process.env.AIRWEAVE_BASE_URL }),
  });

  // Test 1: Basic generateText with tool
  console.log('─'.repeat(50));
  console.log('Test 1: generateText with airweaveSearch tool');
  console.log('─'.repeat(50));
  
  try {
    const { text, steps } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: 'Search for any documents and summarize what you find. Keep it brief.',
      tools: { search },
      maxSteps: 3,
    });

    console.log('\n📝 Response:', text);
    console.log('\n📊 Steps taken:', steps.length);
    
    // Check if the tool was actually called
    const toolCalls = steps.flatMap(s => s.toolCalls || []);
    if (toolCalls.length > 0) {
      console.log('✅ Tool was called', toolCalls.length, 'time(s)');
      toolCalls.forEach((call: any, i) => {
        const query = call.args?.query || call.input?.query || '(unknown)';
        console.log(`   Call ${i + 1}: query="${query}"`);
      });
    } else {
      console.log('⚠️  Tool was not called (model may have decided not to search)');
    }
  } catch (error: any) {
    console.error('❌ Test 1 failed:', error.message);
    if (error.cause) console.error('   Cause:', error.cause);
  }

  // Test 2: Streaming response
  console.log('\n' + '─'.repeat(50));
  console.log('Test 2: streamText with airweaveSearch tool');
  console.log('─'.repeat(50));

  try {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      prompt: 'Search for recent items and list the top 3 results with brief descriptions.',
      tools: { search },
      maxSteps: 3,
    });

    process.stdout.write('\n📝 Streaming response: ');
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
    console.log('\n\n✅ Streaming completed');
  } catch (error: any) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test 3: Direct tool execution (without LLM)
  console.log('\n' + '─'.repeat(50));
  console.log('Test 3: Direct tool execution');
  console.log('─'.repeat(50));

  try {
    const directSearch = airweaveSearch({
      defaultCollection: COLLECTION,
      ...(process.env.AIRWEAVE_BASE_URL && { baseUrl: process.env.AIRWEAVE_BASE_URL }),
      generateAnswer: true, // Test AI answer generation
    });

    const result = await directSearch.execute(
      { query: 'test', limit: 5 },
      { toolCallId: 'test-call', messages: [] }
    );

    console.log('\n📊 Results:', result.results.length, 'items');
    if (result.answer) {
      console.log('💡 AI Answer:', result.answer);
    }
    if (result.results.length > 0) {
      console.log('\n📄 First result:');
      console.log('   ID:', result.results[0].id);
      console.log('   Score:', result.results[0].score);
      console.log('   Name:', result.results[0].payload?.name || '(no name)');
    }
    console.log('\n✅ Direct execution completed');
  } catch (error: any) {
    console.error('❌ Test 3 failed:', error.message);
    if (error.cause) console.error('   Cause:', error.cause);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('🏁 E2E Tests Complete');
  console.log('═'.repeat(50));
}

runTests().catch(console.error);

