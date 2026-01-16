# Tiger Memory MCP Server

A memory system for LLMs to store and retrieve information via the [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## Quick Start

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
npm i
cp .env.sample .env
npm run build
```

## Development

- Build: `npm run build`
- Watch: `npm run watch`
- Test: `npm run inspector`

### Testing with MCP Inspector

| Field          | Value           |
| -------------- | --------------- |
| Transport Type | `STDIO`         |
| Command        | `node`          |
| Arguments      | `dist/index.js` |

### Testing in Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tiger-memory": {
      "command": "node",
      "args": ["/absolute/path/to/tiger-memory-mcp-server/dist/index.js", "stdio"],
      "env": {
        "PGHOST": "x.y.tsdb.cloud.timescale.com",
        "PGDATABASE": "tsdb",
        "PGPORT": "32467",
        "PGUSER": "readonly_mcp_user",
        "PGPASSWORD": "abc123"
      }
    }
  }
}
```

## Deployment

Deployed via Helm to Kubernetes. See `chart/` directory.

Service DNS: `tiger-memory-mcp-server.savannah-system.svc.cluster.local`

### Database Setup

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Secrets

Create sealed secrets for database, logfire, and tailscale credentials. See original README for commands.
