# Product Requirements Document: Vector Similarity Search for Tiger Memory MCP Server

**Document Status**: Draft  
**Version**: 1.0  
**Last Updated**: January 26, 2026  
**Owner**: Tiger Memory Team

---

## Executive Summary

This PRD outlines a transformative feature for the Tiger Memory MCP Server: **Vector Similarity Search**. This capability will enable LLMs to semantically search and retrieve memories based on meaning rather than exact keyword matching, fundamentally improving the system's utility for complex reasoning tasks.

**Problem**: Currently, the Tiger Memory system can only retrieve ALL memories for a given scope, forcing LLMs to load potentially hundreds or thousands of memories into their limited context window. This severely limits the practical size of memory systems and the value they provide.

**Solution**: Add vector embedding and similarity search, allowing LLMs to request "memories related to X topic" and receive the most relevant subset, dramatically improving context efficiency and memory system scalability.

**Expected Impact**:

- 10-100x improvement in query efficiency for large memory sets (1000+ memories)
- Enable scope sizes up to 100k+ memories (vs. current practical limit of ~1000)
- Unlock semantic reasoning capabilities (find related experiences, similar patterns)
- Position Tiger Memory as enterprise-grade LLM memory system

---

## 1. Problem Statement

### 1.1 Current State: Keyword-Only Retrieval

The Tiger Memory system currently exposes a single retrieval mechanism:

```
RECALL(scope: string) → Memory[]
// Returns: ALL memories for the scope, regardless of relevance
```

**Example Scenario**:

```
User Memory Scope: "alice_preferences"
Stored Memories (50):
  - "Alice prefers dark mode UI"
  - "Alice uses Safari on Mac"
  - "Alice's favorite color is blue"
  - "Alice wants faster load times"
  - "Alice dislikes modal dialogs"
  - ... 45 more memories

LLM Query: "Help Alice with her UI preferences"

Current Behavior:
  → Retrieve all 50 memories
  → Feed into context window
  → LLM reads all 50 to find 3 relevant ones
  → Wastes ~1400 tokens on irrelevant memories
  → Model loses efficiency and reasoning clarity
```

### 1.2 Limitations of Scope-Only Queries

**Scale Limitation**:

- Practical memory count per scope: ~500-1000 (before context bloat)
- Context tokens used by recall: 1000-5000 tokens per scope
- Real-world systems quickly exceed this (conversation history, user preferences, project context)

**Relevance Problem**:

- No way to prioritize memories
- LLM must filter irrelevant memories manually
- Reduces quality of decision-making

**Performance Issue**:

- Database returns entire scope
- Network bandwidth wasted on irrelevant data
- Response latency increases linearly with memory count

### 1.3 Competitive Disadvantage

Modern LLM memory systems (e.g., Anthropic's memory features, LangChain, ChromaDB) all support semantic search. Without this capability:

- Tiger Memory is relegated to prototype use cases
- Cannot compete for production deployments
- Limits adoption in multi-memory-intensive applications

---

## 2. Vision & Goals

### 2.1 High-Level Vision

Transform Tiger Memory from a simple key-value store into an **intelligent semantic memory system** where LLMs can ask natural questions and receive contextually relevant memories.

### 2.2 Strategic Goals

| Goal                               | Impact                           | Timeline    |
| ---------------------------------- | -------------------------------- | ----------- |
| Enable semantic search             | 10-100x efficiency gain          | MVP Q2 2025 |
| Support 10k+ memories per scope    | Unlock enterprise use cases      | MVP         |
| Improve context utilization        | Better LLM reasoning             | MVP         |
| Maintain backward compatibility    | No breaking changes              | MVP         |
| Provide flexible embedding options | Support various embedding models | Phase 2     |

### 2.3 Success Metrics

**Quantitative**:

- [ ] 90% of queries return <5 relevant memories (vs. all memories)
- [ ] Memory recall latency <200ms for scopes up to 10k memories
- [ ] Context token usage reduced by 50% on average (vs. full scope recall)
- [ ] Support 100k+ memories per scope without degradation
- [ ] Query accuracy ≥ 90% (human evaluation of relevance)

**Qualitative**:

- [ ] LLMs report improved decision-making quality
- [ ] System is perceived as "intelligent" vs. "mechanical"
- [ ] Adoption increases by 3-5x in real-world use cases

---

## 3. Feature Specification

### 3.1 New API Tool: Search Memories

**Tool Name**: `search` (or `search_memories`)  
**Type**: POST request / MCP Tool  
**Route**: `/memory/search` or `/memory/search/{scope}`  
**Description**: Find semantically similar memories within a scope

#### Input Schema

```typescript
{
  scope: string           // Target scope (required)
  query: string           // Search query/prompt (required, min 1 char)
  limit?: number          // Max results to return (optional, default: 10, max: 100)
  score_threshold?: number // Min similarity score 0-1 (optional, default: 0.5)
}
```

**Field Descriptions**:

- `scope`: Same as existing recall - identifies memory namespace
- `query`: Natural language question or context. Examples:
  - "dark mode UI preferences"
  - "performance improvements"
  - "user frustrations"
- `limit`: How many memories to return (pagination-like mechanism)
- `score_threshold`: Minimum similarity score (0.5 = 50% similar). Use to filter weak matches.

#### Output Schema

```typescript
{
  scope: string;
  query: string;
  results: Array<{
    id: string;
    content: string;
    source: string | null;
    created_at: Date;
    updated_at: Date;
    score: number; // Similarity score 0-1 (1 = perfect match)
    distance?: number; // Optional: raw distance metric for debugging
  }>;
  total_memories_in_scope: number; // For context (not all returned)
  search_time_ms: number; // Performance transparency
}
```

**Example Response**:

```json
{
  "scope": "alice_preferences",
  "query": "UI preferences and visual design",
  "results": [
    {
      "id": "1",
      "content": "Alice prefers dark mode UI",
      "source": "https://chat.example.com/settings",
      "created_at": "2025-01-20T10:30:00Z",
      "updated_at": "2025-01-20T10:30:00Z",
      "score": 0.92
    },
    {
      "id": "3",
      "content": "Alice's favorite color is blue",
      "source": null,
      "created_at": "2025-01-20T11:00:00Z",
      "updated_at": "2025-01-20T11:00:00Z",
      "score": 0.71
    }
  ],
  "total_memories_in_scope": 50,
  "search_time_ms": 42
}
```

### 3.2 Database Schema Changes

#### New Table: `memory_embeddings`

```sql
CREATE TABLE tiger_memory.memory_embeddings (
  memory_id int8 NOT NULL PRIMARY KEY REFERENCES tiger_memory.memory(id) ON DELETE CASCADE,
  embedding vector(1536),                    -- OpenAI embedding dimension (configurable)
  embedding_model TEXT NOT NULL,             -- Model used (e.g., 'text-embedding-3-small')
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (memory_id) REFERENCES tiger_memory.memory(id) ON DELETE CASCADE
);
```

**Purpose**:

- Store vector embeddings for each memory
- Track which embedding model was used
- Enable similarity search via pgvector

**Design Rationale**:

- Separate table to keep memory table lightweight
- 1:1 relationship with memory table
- CASCADE delete ensures cleanup if memory deleted

#### Enable pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### New Indexes for Performance

```sql
-- IVFFlat index for fast approximate similarity search
CREATE INDEX idx_memory_embedding_ivf
  ON tiger_memory.memory_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Regular index on memory_id for lookups
CREATE INDEX idx_memory_embeddings_memory_id
  ON tiger_memory.memory_embeddings (memory_id);

-- Index on embedding_model for filtering by model
CREATE INDEX idx_memory_embeddings_model
  ON tiger_memory.memory_embeddings (embedding_model);
```

**Performance**: IVFFlat trades ~1% accuracy for 10-100x speed improvement on large datasets.

#### Schema Extension: Track Embeddings Status

Optional future column for memory table (Phase 2):

```sql
ALTER TABLE tiger_memory.memory
ADD COLUMN embedding_status TEXT DEFAULT 'pending'
  CHECK (embedding_status IN ('pending', 'completed', 'failed'));
```

### 3.3 Embedding Strategy

#### Default: OpenAI Embeddings (MVP)

**Model**: `text-embedding-3-small`

- **Dimensions**: 1536
- **Cost**: ~$0.02 per 1M tokens
- **Speed**: ~10-50ms per request
- **Quality**: High (state-of-the-art)
- **Availability**: Widely available via OpenAI API

**Configuration**:

```env
EMBEDDING_PROVIDER=openai         # default
EMBEDDING_MODEL=text-embedding-3-small
OPENAI_API_KEY=sk-...
```

**Alternative Options (Future)**:

- `text-embedding-3-large` (more accurate, higher cost)
- Local models: `sentence-transformers` (no API cost, slower)
- Other providers: Cohere, Hugging Face

#### Embedding Logic

```typescript
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  getDimensions(): number;
  getModelName(): string;
}

// For each memory:
// 1. On remember: Queue embedding job
// 2. Async: Call embedding API
// 3. Store: Save vector to memory_embeddings table
// 4. On search: Use vector for similarity search
```

**Cost Calculation**:

- Memory content: 100 tokens on average
- Scope size: 10,000 memories
- Total tokens: 1,000,000
- Cost at $0.02/1M: ~$0.02 per 10k memories
- Monthly cost scale: ~$2-20/month depending on usage

### 3.4 Search Algorithm

#### Similarity Metric: Cosine Distance

```
similarity = 1 - cosine_distance(query_vector, memory_vector)
range: [0, 1] where 1 = identical, 0 = completely different
```

**Why Cosine Similarity?**

- Standard for semantic search
- Efficient with pgvector
- Intuitive (1 = same meaning)
- Works well with embeddings

#### Query Processing

```
1. INPUT: Search query ("UI preferences")
   ↓
2. EMBED: Convert query to vector using embedding model
   ↓
3. FILTER: Find memories in scope (WHERE scope = ? AND deleted_at IS NULL)
   ↓
4. SEARCH: Find K-nearest vectors (ORDER BY embedding <-> query_vector LIMIT ?)
   ↓
5. SCORE: Calculate similarity scores [0, 1]
   ↓
6. FILTER: Keep only scores >= threshold
   ↓
7. SORT: Order by score (descending)
   ↓
8. RETURN: Top N results with metadata
```

#### Search Query SQL

```sql
SELECT
  m.id,
  m.content,
  m.source,
  m.created_at,
  m.updated_at,
  1 - (me.embedding <-> $1::vector) as similarity_score,
  me.embedding_model
FROM tiger_memory.memory m
JOIN tiger_memory.memory_embeddings me ON m.id = me.memory_id
WHERE m.scope = $2
  AND m.deleted_at IS NULL
  AND me.embedding_model = $3
ORDER BY me.embedding <-> $1
LIMIT $4;
```

Performance: ~50-200ms for scopes with 10k memories (with IVFFlat index)

### 3.5 Backward Compatibility

**Existing APIs Unchanged**:

- ✓ `remember()` - Works as before, embeddings created asynchronously
- ✓ `recall()` - Returns all memories (no changes)
- ✓ `update()` - Works as before, embeddings updated
- ✓ `forget()` - Soft deletes handled (embeddings cascade delete)

**New Tool**:

- ✓ `search()` - New, additive feature

**No Breaking Changes**: Existing clients continue to work without modification.

---

## 4. Technical Implementation Plan

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude (LLM Client)                      │
├─────────────────────────────────────────────────────────────┤
│                   Model Context Protocol (MCP)              │
├─────────────────────────────────────────────────────────────┤
│  NEW: search tool + 3 existing tools (remember/recall/etc)  │
├─────────────────────────────────────────────────────────────┤
│                    MCP Boilerplate                          │
├─────────────────────────────────────────────────────────────┤
│    NEW: searchFactory          (Query + vector search)      │
│         rememberFactory        (Existing, + async embed)    │
│         recallFactory          (Existing, unchanged)        │
│         updateFactory          (Existing, + embed update)   │
│         forgetFactory          (Existing, + cascade delete) │
├─────────────────────────────────────────────────────────────┤
│           ┌──────────────────────────────────┐              │
│           │ NEW: EmbeddingService            │              │
│           │ - embed(text) → vector           │              │
│           │ - supports multiple providers    │              │
│           └──────────────────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│           ┌──────────────────────────────────┐              │
│           │ NEW: Vector Search Executor      │              │
│           │ - similarity search with pgvector│              │
│           │ - query optimization             │              │
│           └──────────────────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                  PostgreSQL Connection Pool                 │
└─────────────────────────────────────────────────────────────┘
              │
              ↓
    ┌─────────────────────────────────────┐
    │   PostgreSQL Database               │
    │ ┌──────────────────────────────────┐│
    │ │ memory (existing)                 ││
    │ │ memory_embeddings (NEW)           ││
    │ │ pgvector extension (NEW)          ││
    │ └──────────────────────────────────┘│
    └─────────────────────────────────────┘
```

### 4.2 Component Breakdown

#### Component 1: EmbeddingService

**Purpose**: Abstract embedding provider interface

**File**: `src/services/embeddingService.ts`

```typescript
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  getDimensions(): number;
  getModelName(): string;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text,
    });
    return response.data[0].embedding;
  }

  getDimensions(): number {
    // 1536 for text-embedding-3-small
    return 1536;
  }

  getModelName(): string {
    return this.model;
  }
}

export function createEmbeddingProvider(
  config: EmbeddingConfig,
): EmbeddingProvider {
  if (config.provider === 'openai') {
    return new OpenAIEmbeddingProvider(config.apiKey, config.model);
  }
  // Future: other providers
  throw new Error(`Unknown embedding provider: ${config.provider}`);
}
```

#### Component 2: Search Handler

**Purpose**: Implements search tool logic

**File**: `src/apis/search.ts`

```typescript
export const searchFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ pgPool, embeddingService }) => ({
  name: 'search',
  method: 'post',
  route: '/memory/search',
  config: { ... },
  fn: async ({ scope, query, limit = 10, score_threshold = 0.5 }) => {
    // 1. Embed the query
    const queryVector = await embeddingService.embed(query);

    // 2. Search similar memories
    const results = await pgPool.query(
      `SELECT m.id, m.content, m.source, m.created_at, m.updated_at,
              1 - (me.embedding <-> $1::vector) as score
       FROM tiger_memory.memory m
       JOIN tiger_memory.memory_embeddings me ON m.id = me.memory_id
       WHERE m.scope = $2 AND m.deleted_at IS NULL
       ORDER BY me.embedding <-> $1
       LIMIT $3`,
      [JSON.stringify(queryVector), scope, limit]
    );

    // 3. Filter by threshold
    const filtered = results.rows.filter(r => r.score >= score_threshold);

    // 4. Return results
    return {
      scope,
      query,
      results: filtered,
      total_memories_in_scope: await getTotalMemoriesInScope(scope),
      search_time_ms: ...
    };
  }
});
```

#### Component 3: Embedding Queue (Background Processing)

**Purpose**: Asynchronously embed memories to avoid blocking remember() calls

**File**: `src/services/embeddingQueue.ts`

```typescript
export class EmbeddingQueue {
  private queue: Queue<EmbedTask>;

  async queueForEmbedding(memoryId: string): Promise<void> {
    this.queue.add({ memoryId, createdAt: Date.now() });
  }

  private async processQueue(): Promise<void> {
    while (true) {
      const task = await this.queue.get();
      const memory = await getMemory(task.memoryId);

      try {
        const vector = await embeddingService.embed(memory.content);
        await storeEmbedding(memory.id, vector);
      } catch (error) {
        // Retry logic, logging
        await this.queue.nack(task);
      }
    }
  }
}
```

**Design Decision**: Async processing ensures `remember()` returns instantly without waiting for embedding API calls.

#### Component 4: Migration for New Schema

**File**: `migrations/157xxxxxxxxxx-add-vector-search.js`

```javascript
module.exports = {
  async up(db) {
    // Create extension
    await db.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Create table
    await db.query(`
      CREATE TABLE tiger_memory.memory_embeddings (
        memory_id int8 NOT NULL PRIMARY KEY REFERENCES tiger_memory.memory(id) ON DELETE CASCADE,
        embedding vector(1536),
        embedding_model TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes
    await db.query(`
      CREATE INDEX idx_memory_embedding_ivf
        ON tiger_memory.memory_embeddings
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    `);
  },

  async down(db) {
    // Cleanup
    await db.query('DROP TABLE IF EXISTS tiger_memory.memory_embeddings');
    await db.query('DROP EXTENSION IF EXISTS vector');
  },
};
```

### 4.3 Integration Points

#### Modify: remember() to Queue Embeddings

```typescript
// In rememberFactory:
const { id } = await insertMemory(scope, content, source);

// NEW: Queue for asynchronous embedding
if (embeddingService) {
  embeddingQueue.queueForEmbedding(id).catch((err) => {
    logger.warn(`Failed to queue embedding for memory ${id}`, err);
  });
}

return { id };
```

#### Modify: update() to Update Embeddings

```typescript
// In updateFactory:
const updated = await updateMemory(id, scope, content, source);

// NEW: Update embedding if content changed
if (contentChanged && embeddingService) {
  embeddingQueue.queueForEmbedding(id).catch((err) => {
    logger.warn(`Failed to queue re-embedding for memory ${id}`, err);
  });
}

return { id };
```

#### No Changes: forget(), recall()

- `forget()`: Cascade delete handles embedding cleanup
- `recall()`: Unchanged, returns all (backward compatible)

### 4.4 Configuration

#### New Environment Variables

```env
# Embedding Configuration
EMBEDDING_ENABLED=true              # Enable/disable feature
EMBEDDING_PROVIDER=openai           # Provider: openai, local, etc.
EMBEDDING_MODEL=text-embedding-3-small
OPENAI_API_KEY=sk-...              # Required if using OpenAI

# Embedding Queue
EMBEDDING_QUEUE_WORKERS=4           # Concurrent embedding threads
EMBEDDING_QUEUE_BATCH_SIZE=10       # Batch embed requests
EMBEDDING_QUEUE_RETRY_MAX=3         # Max retries before giving up

# Search Configuration
SEARCH_DEFAULT_LIMIT=10             # Default result count
SEARCH_MAX_LIMIT=100                # Maximum allowed results
SEARCH_DEFAULT_THRESHOLD=0.5        # Default similarity threshold
```

#### Backward Compatibility

- `EMBEDDING_ENABLED=false` disables feature (search tool unavailable)
- Existing environment variables unchanged
- No required new variables (feature disabled by default initially)

### 4.5 Phased Rollout

#### Phase 1: MVP (Weeks 1-4)

**Scope**: Basic vector search with OpenAI embeddings

- [x] Add pgvector extension and schema
- [x] Create EmbeddingService (OpenAI only)
- [x] Implement search tool
- [x] Add async embedding queue
- [x] Write tests and documentation
- [x] Deploy to staging

**Deliverables**: Working search feature with OpenAI embeddings

#### Phase 2: Optimization (Weeks 5-8)

- [ ] Add local embedding options (sentence-transformers)
- [ ] Implement embedding caching
- [ ] Performance tuning (batch embedding, index optimization)
- [ ] Cost optimization (compression, filtering)

**Deliverables**: Multiple embedding providers, optimized performance

#### Phase 3: Advanced Features (Weeks 9+)

- [ ] Search result re-ranking (LLM-based)
- [ ] Multi-query search (combine multiple queries)
- [ ] Embedding versioning (support model upgrades)
- [ ] Search analytics (popular queries, clustering)

**Deliverables**: Advanced search capabilities

---

## 5. User Stories

### Story 1: Save a Memory with Automatic Embedding

**As a** developer using Tiger Memory  
**I want** memories to be automatically embedded when created  
**So that** I don't need to manually manage embeddings

**Acceptance Criteria**:

- [ ] When `remember()` is called, it returns immediately
- [ ] Embedding is created asynchronously in background
- [ ] Memory is searchable once embedding completes
- [ ] Embedding failures don't block memory creation

**Example**:

```
POST /memory {
  scope: "user_alice",
  content: "Alice prefers dark mode",
  source: "..."
}

Response: { id: "123" }  ← Returns immediately

Background: Embedding created ~2s later
```

### Story 2: Search Memories by Semantic Similarity

**As a** Claude instance using Tiger Memory  
**I want** to search for memories semantically  
**So that** I can retrieve only the most relevant memories without loading everything

**Acceptance Criteria**:

- [ ] `search()` tool is available in MCP
- [ ] Query returns only relevant memories (similarity score > threshold)
- [ ] Results include similarity scores
- [ ] Response includes total memory count for context
- [ ] Limit parameter works correctly (1-100)
- [ ] Response time <200ms for 10k memory scopes

**Example**:

```
POST /memory/search {
  scope: "user_alice",
  query: "what are alice's UI preferences?",
  limit: 5,
  score_threshold: 0.6
}

Response: {
  results: [
    { id: "1", content: "Alice prefers dark mode", score: 0.95 },
    { id: "3", content: "Alice likes blue color", score: 0.72 }
  ],
  total_memories_in_scope: 50,
  search_time_ms: 45
}
```

### Story 3: Improve Search with Better Queries

**As a** user of Tiger Memory  
**I want** to refine search results using score thresholds  
**So that** I can control precision vs. recall trade-off

**Acceptance Criteria**:

- [ ] `score_threshold` parameter filters low-confidence results
- [ ] Threshold values 0.0-1.0 are supported
- [ ] Results sorted by score (highest first)
- [ ] Empty results returned if no matches meet threshold

**Example**:

```
# High precision: Only very relevant results
POST /memory/search {
  query: "...",
  score_threshold: 0.8  // Very similar
}

# High recall: More results, some less relevant
POST /memory/search {
  query: "...",
  score_threshold: 0.3  // Somewhat similar
}
```

### Story 4: Monitor Embedding Status

**As a** developer  
**I want** to know if a memory's embedding is complete  
**So that** I can decide whether to use full recall or search

**Acceptance Criteria**:

- [ ] Optional `embedding_status` field in recall response (future)
- [ ] Status values: "pending", "completed", "failed"
- [ ] Failed embeddings logged with error details
- [ ] Automatic retry mechanism for failed embeddings

**Example**:

```
GET /memory/user_alice

Response: {
  memories: [
    { id: "1", content: "...", embedding_status: "completed" },
    { id: "2", content: "...", embedding_status: "pending" },
    { id: "3", content: "...", embedding_status: "failed" }
  ]
}
```

---

## 6. Success Criteria & Testing

### 6.1 Functional Testing

| Test                      | Criteria                                    | Status |
| ------------------------- | ------------------------------------------- | ------ |
| Remember queues embedding | Embedding job created for new memory        | TBD    |
| Search returns results    | Query returns semantically similar memories | TBD    |
| Score threshold works     | Results with score < threshold filtered     | TBD    |
| Limit parameter works     | Returns max N results                       | TBD    |
| Soft delete cleanup       | Embedding deleted when memory soft-deleted  | TBD    |
| Backward compatibility    | Existing APIs work unchanged                | TBD    |
| Empty scope handling      | Returns empty results for empty scope       | TBD    |
| Large scopes              | 10k memories searchable in <200ms           | TBD    |

### 6.2 Performance Testing

| Metric                              | Target | Threshold |
| ----------------------------------- | ------ | --------- |
| Search latency (1k memories)        | 50ms   | <100ms    |
| Search latency (10k memories)       | 100ms  | <200ms    |
| Remember latency (with queue)       | <50ms  | <100ms    |
| Embedding creation (per 100 tokens) | 20ms   | <50ms     |
| Database query (indexed search)     | 10ms   | <30ms     |

### 6.3 Integration Testing

- [ ] MCP inspector tool shows search tool
- [ ] HTTP endpoint responds correctly
- [ ] STDIO transport works with search
- [ ] Migrations run successfully
- [ ] Connection pooling stable under load

### 6.4 Load Testing

- [ ] 1000 concurrent searches on 10k-memory scope
- [ ] 100 concurrent remember calls + 10 searches
- [ ] Embedding queue handles 1000 pending embeddings
- [ ] No memory leaks during extended operation

---

## 7. Risks & Mitigation

### Risk 1: OpenAI API Costs

**Risk**: Embedding costs scale with memory count. 10k memories ≈ $0.02, but could get expensive.

**Likelihood**: Medium (depends on adoption)  
**Impact**: High (cost control important for users)

**Mitigation**:

- [ ] Provide cost estimation in documentation
- [ ] Allow disabling embeddings per-scope (future)
- [ ] Support local embedding models as alternative
- [ ] Implement embedding caching

### Risk 2: Embedding Quality Variations

**Risk**: Different text types (short vs. long, technical vs. casual) may have different embedding quality.

**Likelihood**: Low (OpenAI models are robust)  
**Impact**: Medium (affects search quality)

**Mitigation**:

- [ ] Document best practices (concise memory content)
- [ ] Test with diverse memory types
- [ ] Allow model selection for different quality/cost trade-offs
- [ ] Plan for re-embedding with new models

### Risk 3: Database Performance at Scale

**Risk**: 100k+ memories might degrade search performance despite indexes.

**Likelihood**: Medium (IVFFlat has parameters to tune)  
**Impact**: High (affects user experience)

**Mitigation**:

- [ ] Load test with 100k memories before release
- [ ] Tune IVFFlat parameters (lists, probes)
- [ ] Consider sharding by scope if needed
- [ ] Implement query result caching

### Risk 4: Backward Compatibility

**Risk**: Embedding infrastructure changes might require schema migrations.

**Likelihood**: Low (schema designed for extensibility)  
**Impact**: Low (migrations are automated)

**Mitigation**:

- [ ] Design for model upgrades (separate embedding_model column)
- [ ] Support multiple model versions simultaneously
- [ ] Test migration path thoroughly
- [ ] Plan rollback procedure

### Risk 5: Latency Impact

**Risk**: Async embedding queue might cause delays before memories are searchable.

**Likelihood**: Medium (depends on queue processing speed)  
**Impact**: Medium (users expect instant searchability)

**Mitigation**:

- [ ] Set SLA for embedding completion (e.g., <30s)
- [ ] Alert on queue buildup
- [ ] Add queue monitoring/metrics
- [ ] Auto-scale workers if needed

---

## 8. Metrics & Monitoring

### 8.1 Key Metrics to Track

| Metric                          | Type      | Threshold                 |
| ------------------------------- | --------- | ------------------------- |
| Search request count            | Counter   | -                         |
| Search latency (p50, p95, p99)  | Histogram | p95 <100ms                |
| Search result count (avg)       | Gauge     | -                         |
| Embedding queue size            | Gauge     | <1000 pending             |
| Embedding creation time         | Histogram | <50ms (api) + <1s (total) |
| Embedding success rate          | Counter   | >99%                      |
| API calls to embedding provider | Counter   | For cost tracking         |

### 8.2 Dashboards

**Tiger Memory Search Monitoring Dashboard**:

- Search request volume (QPS)
- Search latency percentiles
- Popular search queries
- Embedding queue status
- Cost tracking (OpenAI API calls)
- Error rates by type

### 8.3 Alerting

```
Alert: EmbeddingQueueBacklog
Condition: queue_size > 5000
Severity: Warning
Action: Scale up embedding workers

Alert: EmbeddingFailureRate
Condition: failure_rate > 5%
Severity: Critical
Action: Page on-call, investigate API issues

Alert: SearchLatencyP95
Condition: p95_latency > 200ms
Severity: Warning
Action: Investigate, consider index tuning
```

---

## 9. Dependencies & Constraints

### 9.1 External Dependencies

| Dependency | Requirement    | Version | Purpose                      |
| ---------- | -------------- | ------- | ---------------------------- |
| OpenAI API | Required (MVP) | Latest  | Embeddings                   |
| pgvector   | Required       | ^0.2.0  | Vector search in PostgreSQL  |
| PostgreSQL | Required       | ^15     | Database with vector support |
| Node.js    | Required       | ^22     | Runtime                      |

### 9.2 Constraints

- **Database**: PostgreSQL must have pgvector extension
- **API Keys**: OpenAI API key required (can be disabled)
- **Latency**: Search must complete <200ms (p99)
- **Cost**: OpenAI embeddings cost ~$2-20/month (depends on usage)
- **Storage**: Vector storage ~0.5KB per memory (1536-dim vector)
- **Memory**: Embedding queue worker threads (configurable)

### 9.3 Pre-requisites

- [x] PostgreSQL 15+ with pgvector support
- [x] OpenAI API account (if using OpenAI provider)
- [x] Docker image updated to include pgvector support
- [x] Helm chart updated with new environment variables

---

## 10. Future Enhancements

### 10.1 Phase 2: Local Embeddings

**Objective**: Support local embedding models to eliminate API costs

**Approach**:

- Integrate `sentence-transformers` (Python-based)
- Provide Docker sidecar container for embeddings
- Support multiple models (different quality/speed trade-offs)

**Benefits**: Zero API costs, privacy (no external API calls)  
**Trade-offs**: Slower (50-200ms/embedding), requires GPU for speed

### 10.2 Phase 2: Hybrid Search

**Objective**: Combine keyword and semantic search

**Approach**:

- Keep keyword index on memory content
- Allow combining keyword filters + semantic ranking
- Example: `search("alice preferences", keywords=["dark", "UI"])`

**Benefits**: Better precision, supports both search modes

### 10.3 Phase 3: Result Re-ranking

**Objective**: Use LLM to re-rank search results for better relevance

**Approach**:

- Get top-K results from vector search
- Send to LLM: "Rank these by relevance to query"
- Return re-ranked results

**Benefits**: Better quality, more flexible relevance

### 10.4 Phase 3: Memory Summarization

**Objective**: Summarize memories when scope is very large

**Approach**:

- Detect when scope has 1000+ memories
- Offer summary + detailed search option
- Summarize semantically related memories

**Benefits**: Context efficiency, faster recall

### 10.5 Phase 4: Cross-Scope Search

**Objective**: Search across multiple scopes simultaneously

**Approach**:

- Accept scope list or wildcard
- Search all matching scopes
- Return results with scope tags

**Benefits**: Unified search experience, cross-context insights

### 10.6 Phase 4: Memory Clustering

**Objective**: Automatically group related memories

**Approach**:

- Cluster embeddings using k-means
- Tag clusters (e.g., "UI Preferences", "Performance")
- Allow browsing by cluster

**Benefits**: Better memory organization, discovery

---

## 11. Implementation Checklist

### Pre-Development

- [ ] Get stakeholder approval on approach
- [ ] Review budget for OpenAI API costs
- [ ] Coordinate with DevOps on pgvector support
- [ ] Plan database migration strategy

### Development (MVP)

- [ ] Create migration for new schema
- [ ] Implement EmbeddingService interface
- [ ] Implement OpenAI embedding provider
- [ ] Implement embedding queue
- [ ] Implement search tool handler
- [ ] Write unit tests (>90% coverage)
- [ ] Write integration tests
- [ ] Create performance benchmarks
- [ ] Update documentation

### Testing

- [ ] Functional testing (all scenarios)
- [ ] Load testing (10k memories, 100 QPS)
- [ ] Integration testing with MCP
- [ ] Staging deployment + validation
- [ ] Cost validation (actual usage)

### Deployment

- [ ] Update Docker image (pgvector)
- [ ] Update Helm chart (env vars)
- [ ] Create deployment runbook
- [ ] Set up monitoring + alerts
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor for issues

### Documentation

- [ ] Update API documentation
- [ ] Create usage guide
- [ ] Document cost estimation
- [ ] Create troubleshooting guide
- [ ] Update README

### Post-Launch

- [ ] Gather user feedback
- [ ] Monitor performance metrics
- [ ] Plan Phase 2 work
- [ ] Optimize based on real usage

---

## 12. Success Definition

### Launch Success

The feature is successfully launched when:

1. **Functionality**: Search tool works correctly for 100+ test scopes
2. **Performance**: Search <200ms p99 for 10k-memory scopes
3. **Reliability**: 99.9% embedding success rate
4. **Backward Compatibility**: All existing tools work unchanged
5. **Documentation**: Users can implement search in <30 minutes
6. **Adoption**: 5+ customers using search feature within 3 months

### Long-Term Success

The feature is successful long-term if:

1. **Usage**: 50%+ of queries use search (vs. full recall)
2. **Efficiency**: Context tokens per query reduced by 50%
3. **Scale**: Systems with 10k+ memories in production
4. **Quality**: Users report improved LLM decision-making
5. **Cost**: OpenAI costs <$50/month even for large deployments
6. **Adoption**: Becomes default feature for new customers

---

## 13. Appendix: Technical Reference

### A. pgvector Installation

```bash
# Docker image needs pgvector support
FROM postgres:17-alpine
RUN apk add --no-cache postgresql-dev gcc && \
    git clone https://github.com/pgvector/pgvector.git && \
    cd pgvector && make && make install

# Alternative: Use official pgvector Docker image
FROM pgvector/pgvector:latest
```

### B. OpenAI Embeddings API

```bash
# Cost: $0.02 per 1M input tokens
# Speed: ~10-50ms per request
# Model: text-embedding-3-small (1536 dimensions)

curl https://api.openai.com/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "input": "Alice prefers dark mode",
    "model": "text-embedding-3-small"
  }'

# Response:
{
  "object": "list",
  "data": [{
    "object": "embedding",
    "embedding": [0.123, -0.456, ...],
    "index": 0
  }],
  "model": "text-embedding-3-small",
  "usage": {"prompt_tokens": 5, "total_tokens": 5}
}
```

### C. Cosine Similarity Formula

```
cosine_similarity = dot_product(A, B) / (magnitude(A) * magnitude(B))
cosine_distance = 1 - cosine_similarity
pgvector operator: <-> (distance)
```

### D. IVFFlat Index Parameters

```sql
CREATE INDEX idx ON table
  USING ivfflat (column vector_cosine_ops)
  WITH (lists = 100);  -- Number of clusters

-- Tuning:
-- lists = sqrt(rows) -- reasonable starting point
-- 10k rows → lists = 100
-- 100k rows → lists = 316
```

### E. Example Search Implementation

```typescript
async function search(
  scope: string,
  query: string,
  limit: number = 10,
  scoreThreshold: number = 0.5,
): Promise<SearchResults> {
  const startTime = Date.now();

  // Embed the query
  const queryVector = await embeddingService.embed(query);

  // Search with pgvector
  const results = await pgPool.query(
    `SELECT m.id, m.content, m.source, m.created_at, m.updated_at,
            1 - (me.embedding <-> $1::vector) as score
     FROM tiger_memory.memory m
     JOIN tiger_memory.memory_embeddings me ON m.id = me.memory_id
     WHERE m.scope = $2 AND m.deleted_at IS NULL
     ORDER BY me.embedding <-> $1::vector
     LIMIT $3`,
    [JSON.stringify(queryVector), scope, limit],
  );

  // Filter and return
  return {
    scope,
    query,
    results: results.rows.filter((r) => r.score >= scoreThreshold),
    total_memories_in_scope: await countMemories(scope),
    search_time_ms: Date.now() - startTime,
  };
}
```

---

## 14. Glossary

| Term                  | Definition                                                                             |
| --------------------- | -------------------------------------------------------------------------------------- |
| **Embedding**         | Numerical vector representation of text (fixed length: 1536 for OpenAI)                |
| **Vector Database**   | Database with native support for vector similarity queries                             |
| **Cosine Similarity** | Measure of similarity between vectors (0 = different, 1 = identical)                   |
| **IVFFlat**           | Index type for approximate nearest neighbor search (fast but ~1% accuracy loss)        |
| **pgvector**          | PostgreSQL extension for vector similarity search                                      |
| **Score**             | Similarity score between query and memory (0-1, 1 = perfect match)                     |
| **Embedding Model**   | Neural network that converts text to embeddings (e.g., text-embedding-3-small)         |
| **Semantic Search**   | Finding relevant results based on meaning (vs. keyword matching)                       |
| **Query**             | Search input (natural language question or context)                                    |
| **Recall**            | Fraction of relevant results retrieved (high recall = find all)                        |
| **Precision**         | Fraction of retrieved results that are relevant (high precision = few false positives) |

---

**Document Version**: 1.0  
**Last Updated**: January 26, 2026  
**Status**: Ready for Implementation
