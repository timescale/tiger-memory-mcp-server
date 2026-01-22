# Tiger Memory MCP Server

Un systeme de memoire simple concu pour permettre aux LLM de stocker et recuperer des informations. Il fournit des outils cibles aux LLM via le [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## API

Toutes les methodes sont exposees en tant qu'outils MCP et points de terminaison d'API REST.

## Developpement

Cloner et lancer le serveur en local.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Compilation

Lancez `npm i` pour installer les dependances et compiler le projet. Utilisez `npm run watch` pour recompiler lors des changements.

Creez un fichier `.env` a partir du fichier `.env.sample`.

```bash
cp .env.sample .env
```

### Tests

Le MCP Inspector est tres pratique.

```bash
npm run inspector
```

| Champ             | Valeur          |
| ----------------- | --------------- |
| Type de transport | `STDIO`         |
| Commande          | `node`          |
| Arguments         | `dist/index.js` |

#### Tests dans Claude Desktop

Creez ou modifiez le fichier `~/Library/Application Support/Claude/claude_desktop_config.json` pour ajouter une entree comme suit, en veillant a utiliser le chemin absolu vers votre projet local `tiger-memory-mcp-server` et de vraies informations d'identification pour la base de donnees.

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

## Deploiement

Nous utilisons un chart Helm pour le deploiement sur Kubernetes. Voir le repertoire `chart/` pour les details.

Le service est accessible aux autres services du cluster via le nom DNS `tiger-memory-mcp-server.savannah-system.svc.cluster.local`.

### Configuration de la base de donnees

Creation de l'utilisateur de base de donnees :

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Secrets

Lancez la commande suivante pour creer les secrets scelles necessaires. Assurez-vous de renseigner les bonnes valeurs.

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

Mettez a jour `./chart/values/dev.yaml` avec la sortie.
