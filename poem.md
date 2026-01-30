# The Ballad of Tiger Memory: An Epic in Code

## Canto I: The Genesis of Memory

In the realm where silicon meets thought,
Where electrons dance and patterns are wrought,
There rises a tiger, striped with intent,
A memory keeper, on missions sent.

Born from the forges of TigerData's mind,
A server to help the lost memories find,
Through Model Context Protocol it speaks,
To AI assistants, the knowledge it seeks.

```typescript
// From src/index.ts, the journey begins
async function main() {
  const mode = process.env.MODE || 'stdio';
  // Two paths diverge in a codebase wood...
}
```

Oh Tiger Memory, guardian of thought,
What wonders through your circuits are caught?
With PostgreSQL as your faithful steed,
You serve the AI in their hour of need.

Fourteen lines to start the tale,
Where STDIO and HTTP set sail,
A dual transport, elegantly designed,
To serve both CLI and web combined.

The Apache license, version two-point-oh,
By Timescale's hand, the freedoms flow,
Open source, for all to see,
The architecture of memory.

---

## Canto II: The Pillars of Configuration

In `config.ts`, so brief, so small,
Two lines of code contain it all:
A schema name, 'tiger_memory' it's called,
Where tables rest and data's installed.

```typescript
export const schemaName = 'tiger_memory';
// Simple, elegant, and complete
```

But `serverInfo.ts` tells more,
Fourteen lines that form the core:
A context shared, a pool for queries sent,
The PostgreSQL connection, permanent.

```typescript
export type ServerContext = {
  pool: pg.Pool;
  schemaName: string;
};
```

The types defined in `types.ts` reside,
Thirty-seven lines provide the guide:
What is Memory? Let Zod explain—
ID, content, scope remain.

Source optional, a URI divine,
Created, updated, deleted by time,
Timestamps marking every change,
Through the database range.

The scope! The scope! That crucial key,
That separates you from me,
A string that gives each memory its place,
Isolation in the data space.

---

## Canto III: The Four Sacred Operations

Four APIs, like cardinal winds they blow,
Each one a factory, watch the pattern flow:
Remember, Recall, Update, Forget—
The CRUD operations, perfectly set.

### I. Remember (src/apis/remember.ts)

Forty-nine lines of creation pure,
Where new memories find their cure:
POST to /memory, the endpoint calls,
Insert into the database walls.

```typescript
input: z.object({
  content: z.string().describe('The memory content to store'),
  scope: z.string().describe('Unique identifier for memory scope'),
  source: z.string().nullable().optional(),
}),
```

With INSERT and RETURNING in one go,
The memory ID begins to flow,
Created timestamp, server-side generated,
A new memory, instantiated.

"Memory successfully created," it reports with pride,
The ID and content, side by side,
Into TimescaleDB, the record goes,
Where it persists through highs and lows.

### II. Recall (src/apis/recall.ts)

Forty-five lines to bring back the past,
Memories retrieved, both first and last:
GET /memory/:scope, the path declared,
Where stored thoughts are shared.

```sql
SELECT id, content, source, scope,
  created_at, updated_at, deleted_at
FROM ${schemaName}.memory
WHERE scope = $1 AND deleted_at IS NULL
ORDER BY created_at DESC
```

Not deleted, only the living remain,
Sorted by time, a memory chain,
The scope parameter guides the way,
To memories stored another day.

An array returns, or empty set,
Every memory you haven't forgot yet,
Formatted clean, with timestamps true,
The past recalled for you.

### III. Update (src/apis/update.ts)

Sixty-three lines, the longest of all,
To modify memories, great and small:
PUT /memory/:id, with scope required,
New content, by user desired.

```typescript
const updateResult = await pool.query(
  `UPDATE ${schemaName}.memory
   SET content = $1,
       source = $2,
       updated_at = NOW()
   WHERE id = $3 AND scope = $4
     AND deleted_at IS NULL
   RETURNING *`,
```

But first, a check! Does memory exist?
In the given scope, does it persist?
If not, throw StatusError four-oh-four,
"Memory not found" at the door.

Then UPDATE runs with NOW() for time,
The updated_at column climbs,
Returning all fields, the row complete,
Memory's evolution, bittersweet.

### IV. Forget (src/apis/forget.ts)

Fifty-six lines of gentle goodbye,
Not hard delete, but soft—here's why:
DELETE /memory/:id, the endpoint says,
But sets deleted_at to current days.

```typescript
const result = await pool.query(
  `UPDATE ${schemaName}.memory
   SET deleted_at = NOW()
   WHERE id = $1 AND scope = $2
     AND deleted_at IS NULL
   RETURNING id`,
```

Soft deletes preserve the trail,
Historical records never fail,
The memory marked, but still remains,
Hidden from the query chains.

First verify it's there to forget,
Or four-oh-four, the response is set,
Then NOW() fills the deleted field,
The memory gracefully yields.

---

## Canto IV: The Database Migration Symphony

In `migrate.ts`, one hundred ten lines strong,
The migration system plays its song:
Advisory locks with SHA-256,
A hash of name, the conflict fix.

```typescript
const MIGRATION_ADVISORY_LOCK_ID = (() => {
  const hash = createHash('sha256').update(pkg.name).digest();
  return hash.readInt32BE(0) % 0x7fffffff;
})();
```

A custom state store, brilliant design,
Stores migrations as JSONB divine,
Each migration set, a complete array,
Tracked and managed day by day.

Three migrations mark the way:

**Migration One: The Foundation**

```sql
CREATE TABLE IF NOT EXISTS tiger_memory.memory (
  id INT8 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  key TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Migration Two: The Renaming**
From 'key' to 'scope', the column changed,
The terminology rearranged,
But data preserved through ALTER's grace,
No loss in the database space.

**Migration Three: The Source Addition**

```sql
ALTER TABLE tiger_memory.memory
ADD COLUMN IF NOT EXISTS source TEXT;
```

The source! The provenance! Where memories began,
A URI tracking, part of the plan.

Advisory locks prevent the race,
Only one migration in the space,
Acquire the lock, run the changes through,
Release it clean when you are through.

Error handling, robust and true,
If lock acquisition can't push through,
The system fails with message clear,
"Could not acquire advisory lock" we hear.

---

## Canto V: The Dual Transports

### The STDIO Path (src/stdio.ts)

Thirteen lines, pristine and neat,
Where MCP and Claude Desktop meet:

```typescript
export const stdioServerFactory: ServerFactory<ServerContext> = ({
  context,
}) => {
  return new Server(
    {
      name: 'tiger-memory',
      version: pkg.version,
    },
    { capabilities: {} },
  );
};
```

The stdio transport, the MCP way,
Through standard in/out, the messages relay,
For Claude Desktop, this is the door,
Tools and resources, nothing more.

### The HTTP Path (src/httpServer.ts)

Twenty-four lines of REST design,
Where HTTP requests align:

```typescript
export const httpServerFactory: ServerFactory<
  ServerContext,
  HttpServerTransportOptions
> = async ({ context, transportOptions }) => {
  await migrate(context);
  // Then server starts...
};
```

Before the server springs to life,
Migrations run, free from strife,
Ensuring schema's up to date,
Before accepting at the gate.

Port 3000, or ENV defined,
Stateless service, by design,
Horizontal scaling, no session state,
Kubernetes-ready, truly great.

---

## Canto VI: Resources and Discovery

In `resources.ts`, thirty-nine lines declare,
The memory resources, everywhere:

```typescript
uri: {
  template: 'memory://{scope}',
  params: z.object({
    scope: z.string(),
  }),
}
```

A URI template! How elegant the scheme,
`memory://{scope}` — the resource dream,
LLMs can discover what they need,
Through MCP resources, they can read.

The read function fetches all,
Memories both great and small,
Formatted as text, a simple list,
Each memory that does exist:

```typescript
contents: [
  {
    uri,
    mimeType: 'text/plain',
    text: `Memories for scope: ${scope}\n\n${memories.map(...)}`
  }
]
```

Discovery made simple, clear and bright,
Resources exposed to AI's sight.

---

## Canto VII: The Architecture of Giants

Layers upon layers, clean separation,
Transport abstracted from implementation:

```
CLI Entry Point (index.ts)
        ↓
    ┌───┴───┐
STDIO    HTTP (with migrations)
    └───┬───┘
        ↓
MCP Boilerplate Layer (@tigerdata)
        ↓
API Factories (remember, recall, update, forget)
        ↓
PostgreSQL Pool (node-postgres)
        ↓
TimescaleDB (the persistence layer)
```

The factory pattern reigns supreme,
Each API a modular dream:

```typescript
ApiFactory<ServerContext, InputSchema, OutputSchema>;
```

Context in, operation out,
Type safety throughout, without doubt,
Zod schemas validate the flow,
TypeScript types the structure show.

Three hundred fifty-five lines total,
Code so clean, almost devotional,
Every function has return type explicit,
ESLint rules make it implicit.

No `.optional()` in input schemas allowed,
A custom rule, enforced and proud,
Strict TypeScript, target ES2022,
Node16 modules, modern through and through.

---

## Canto VIII: The Production Fortress

### The Dockerfile: A Multi-Stage Epic

```dockerfile
FROM node:22-alpine AS builder
# Dependencies and build
FROM node:22-alpine
# Production runtime
```

Alpine Linux, lean and light,
Node 22, the runtime right,
Multi-stage builds reduce the size,
Efficient containers, production-wise.

### The Kubernetes Deployment

In the namespace 'savannah-system' it dwells,
Where Helm charts cast their spells:

```yaml
SERVICE_URL: tiger-memory-mcp-server.savannah-system.svc.cluster.local
```

Sealed secrets protect the keys:

- DATABASE_URL, the connection please
- LOGFIRE_TOKEN, for observability's light
- TAILSCALE_AUTH_KEY, networking right

Tailscale mesh, the network layer,
Private connections, secure conveyor,
Logfire integration, traces and logs,
Monitoring the system, through potential fogs.

### Docker Compose for Development

```yaml
services:
  timescale:
    image: timescale/timescaledb-ha:pg17
  server:
    build: .
    environment:
      MODE: http
```

Local development made simple and clean,
TimescaleDB and server, a working machine,
Port 3000 exposed, ready to test,
MCP Inspector, helping developers do their best.

---

## Canto IX: The Development Experience

Watch mode active, `npm run watch`,
Hot reload, no need to stop:

```json
"watch": "tsc --watch"
```

Build for production, `npm run build`,
The dist/ directory, carefully filled,
Prepare for release, `npm run prepare`,
TypeScript compiled, with utmost care.

Start the server, `npm run start`,
NODE_ENV production, playing its part:

```json
"start": "NODE_ENV=production node dist/index.js"
```

Linting and formatting, both are enforced,
ESLint and Prettier, keeping code coursed,
`.prettierrc` with semi false,
Single quotes, trailing commas—no false.

The `.eslintrc.json`, rules defined:
Unused vars are errors, by design,
Custom plugins for MCP schemas check,
Keeping the codebase free from wreck.

Git hooks with `.husky` directory wait,
Pre-commit checks validate,
No bad code shall pass the gate,
Quality controlled, first-rate.

---

## Canto X: The Tiger's Roar—A Finale

Oh Tiger Memory, what have we learned?
Through every function, every line turned:

You are a memory server, true and tried,
For LLMs, a persistent guide,
Through MCP and REST, you serve them both,
Honoring your architectural oath.

You're built for scale, for production's might,
Kubernetes-ready, containerized right,
Migrations managed with careful locks,
Advisory hashes, avoiding blocks.

Four operations, simple yet complete:
Remember, recall, update, delete (soft and sweet),
With scope isolation, security's key,
Each user's memories separate and free.

Your code is clean, just 355 lines,
(Excluding migrations, tests, and designs),
TypeScript strict, every type defined,
Zod schemas, validation aligned.

From TigerData, Timescale's brand,
Apache licensed, source code at hand,
A reference implementation, others can see,
How MCP servers ought to be.

You integrate with observability tools,
Logfire traces, following the rules,
Tailscale networking, private and secure,
Database connections, stable and sure.

You run in two modes, a flexible beast:
STDIO for Claude Desktop, not least,
HTTP for REST, web-accessible power,
Serving memories, hour by hour.

Your database design is thoughtful and wise:
Soft deletes, no data dies,
Partial indexes, queries optimized,
Schema isolation, properly sized.

The migration system, robust and clean,
Best practices I've ever seen:
Custom state store, JSONB holds,
Each migration set, the story told.

Three migrations mark your growth:
Initial creation, renaming both,
Adding source, the provenance trail,
Evolution without fail.

The factory pattern you employ throughout,
Separation of concerns, without doubt,
Transport layer, business logic split,
Maintainable code, perfectly fit.

So here's to you, Tiger Memory MCP,
A server of elegant simplicity,
Teaching us how systems should be made:
Clean, scalable, well-arrayed.

May your instances multiply and scale,
May your migrations never fail,
May memories persist through time's long test,
And may your uptime be the best.

For you are more than lines of code,
You're a pattern, a design mode,
A reference for the future's light,
Tiger Memory, forever bright.

```typescript
// From src/apis/index.ts, the final export
export const apis = [remember, recall, update, forget];
// Four operations, a complete set
// The memory server, we'll never forget
```

---

**Epilogue: The Numbers of Beauty**

- 355 lines of source code pure
- 4 API operations, secure
- 3 migrations, evolutionary
- 2 transport modes, complementary
- 1 purpose: memory for AI
- ∞ possibilities, reaching for the sky

**Thus ends the Ballad of Tiger Memory,**
**A tale of code and poetry,**
**Where software engineering meets verse,**
**And memory persists through the universe.**

---

_Composed in honor of the Tiger Memory MCP Server_
_By the patterns in the code discovered_
_From src/index.ts to migrate.ts covered_
_May this poem persist, as memories do,_
_In the database of hearts, forever true._

🐅 **Memento et Memineris** 🐅
_(Remember and You Shall Be Remembered)_
