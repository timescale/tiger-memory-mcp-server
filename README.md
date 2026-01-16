# Tiger Memory MCP Server

Een eenvoudig geheugensysteem ontworpen om LLM's informatie te laten opslaan en ophalen. Dit biedt gerichte tools aan LLM's via het [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## API

Alle methoden zijn beschikbaar als MCP-tools en REST API-eindpunten.

## Ontwikkeling

De server lokaal klonen en uitvoeren.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Bouwen

Voer `npm i` uit om afhankelijkheden te installeren en het project te bouwen. Gebruik `npm run watch` om opnieuw te bouwen bij wijzigingen.

Maak een `.env`-bestand op basis van het `.env.sample`-bestand.

```bash
cp .env.sample .env
```

### Testen

De MCP Inspector is erg handig.

```bash
npm run inspector
```

| Veld           | Waarde          |
| -------------- | --------------- |
| Transport Type | `STDIO`         |
| Command        | `node`          |
| Arguments      | `dist/index.js` |

#### Testen in Claude Desktop

Maak/bewerk het bestand `~/Library/Application Support/Claude/claude_desktop_config.json` om een item toe te voegen zoals hieronder, zorg ervoor dat je het absolute pad naar je lokale `tiger-memory-mcp-server`-project gebruikt, en echte database-inloggegevens.

```json
{
  "mcpServers": {
    "tiger-memory": {
      "command": "node",
      "args": [
        "/absolute/path/to/tiger-memory-mcp-server/dist/index.js",
        "stdio"
      ],
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

## Implementatie

We gebruiken een Helm-chart om naar Kubernetes te implementeren. Zie de `chart/`-directory voor details.

De service is toegankelijk voor andere services in het cluster via de DNS-naam `tiger-memory-mcp-server.savannah-system.svc.cluster.local`.

### Database-instellingen

De database-gebruiker aanmaken:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Geheimen

Voer het volgende uit om de benodigde sealed secrets aan te maken. Zorg ervoor dat je de juiste waarden invult.

```bash
kubectl -n savannah-system create secret generic tiger-memory-mcp-server-database \
  --dry-run=client \
  --from-literal=user="tiger_memory" \
  --from-literal=password="secret" \
  --from-literal=database="tsdb" \
  --from-literal=host="x.y.tsdb.cloud.timescale.com" \
  --from-literal=port="32467" \
  -o yaml | kubeseal -o yaml

# https://logfire-us.pydantic.dev/tigerdata/tigerdata/settings/write-tokens
kubectl -n savannah-system create secret generic tiger-memory-mcp-server-logfire \
  --dry-run=client \
  --from-literal=token="pylf_v1_us_" \
  -o yaml | kubeseal -o yaml

# https://login.tailscale.com/admin/settings/keys
kubectl -n savannah-system create secret generic tiger-memory-mcp-server-tailscale \
  --dry-run=client \
  --from-literal=authkey="tskey-auth-" \
  -o yaml | kubeseal -o yaml
```

Werk `./chart/values/dev.yaml` bij met de output.
