# Tiger Memory MCP Server

Un semplice sistema di memoria progettato per consentire agli LLM di memorizzare e recuperare informazioni. Questo fornisce alcuni strumenti focalizzati agli LLM tramite il [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## API

Tutti i metodi sono esposti come strumenti MCP e endpoint API REST.

## Sviluppo

Clonazione ed esecuzione del server in locale.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Compilazione

Eseguire `npm i` per installare le dipendenze e compilare il progetto. Usare `npm run watch` per ricompilare ad ogni modifica.

Creare un file `.env` basato sul file `.env.sample`.

```bash
cp .env.sample .env
```

### Testing

L'MCP Inspector è molto utile.

```bash
npm run inspector
```

| Campo          | Valore          |
| -------------- | --------------- |
| Transport Type | `STDIO`         |
| Command        | `node`          |
| Arguments      | `dist/index.js` |

#### Testing in Claude Desktop

Creare/modificare il file `~/Library/Application Support/Claude/claude_desktop_config.json` per aggiungere una voce come la seguente, assicurandosi di utilizzare il percorso assoluto del progetto locale `tiger-memory-mcp-server` e credenziali database reali.

```json
{
  "mcpServers": {
    "tiger-memory": {
      "command": "node",
      "args": [
        "/percorso/assoluto/a/tiger-memory-mcp-server/dist/index.js",
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

## Deployment

Utilizziamo un Helm chart per il deployment su Kubernetes. Vedere la directory `chart/` per i dettagli.

Il servizio è accessibile ad altri servizi nel cluster tramite il nome DNS `tiger-memory-mcp-server.savannah-system.svc.cluster.local`.

### Configurazione database

Creazione dell'utente database:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Secrets

Eseguire quanto segue per creare i sealed secrets necessari. Assicurarsi di inserire i valori corretti.

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

Aggiornare `./chart/values/dev.yaml` con l'output.
