# Tiger Memory MCP Server

Un semplice sistema di memoria progettato per consentire agli LLM di memorizzare e recuperare informazioni. Fornisce alcuni strumenti mirati agli LLM tramite il [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## API

Tutti i metodi sono esposti come strumenti MCP e endpoint REST API.

## Sviluppo

Clonare ed eseguire il server localmente.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Compilazione

Eseguire `npm i` per installare le dipendenze e compilare il progetto. Usare `npm run watch` per ricompilare automaticamente ad ogni modifica.

Creare un file `.env` basandosi sul file `.env.sample`.

```bash
cp .env.sample .env
```

### Test

L'MCP Inspector è molto utile.

```bash
npm run inspector
```

| Campo          | Valore          |
| -------------- | --------------- |
| Tipo Trasporto | `STDIO`         |
| Comando        | `node`          |
| Argomenti      | `dist/index.js` |

#### Test in Claude Desktop

Creare/modificare il file `~/Library/Application Support/Claude/claude_desktop_config.json` per aggiungere una voce come la seguente, assicurandosi di usare il percorso assoluto al proprio progetto locale `tiger-memory-mcp-server` e credenziali del database reali.

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

## Distribuzione

Utilizziamo un Helm chart per distribuire su Kubernetes. Vedere la directory `chart/` per i dettagli.

Il servizio è accessibile agli altri servizi nel cluster tramite il nome DNS `tiger-memory-mcp-server.savannah-system.svc.cluster.local`.

### Configurazione del database

Creazione dell'utente del database:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Segreti

Eseguire i seguenti comandi per creare i sealed secret necessari. Assicurarsi di inserire i valori corretti.

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
