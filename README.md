# Serveur MCP Tiger Memory

Un système de mémoire simple conçu pour permettre aux LLM de stocker et récupérer des informations. Cela fournit des outils ciblés aux LLM via le [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## API

Toutes les méthodes sont exposées en tant qu'outils MCP et points de terminaison d'API REST.

## Développement

Cloner et exécuter le serveur localement.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Compilation

Exécutez `npm i` pour installer les dépendances et compiler le projet. Utilisez `npm run watch` pour recompiler lors de modifications.

Créez un fichier `.env` basé sur le fichier `.env.sample`.

```bash
cp .env.sample .env
```

### Tests

L'Inspecteur MCP est très pratique.

```bash
npm run inspector
```

| Champ             | Valeur          |
| ----------------- | --------------- |
| Type de Transport | `STDIO`         |
| Commande          | `node`          |
| Arguments         | `dist/index.js` |

#### Tests dans Claude Desktop

Créez/modifiez le fichier `~/Library/Application Support/Claude/claude_desktop_config.json` pour ajouter une entrée comme la suivante, en vous assurant d'utiliser le chemin absolu vers votre projet local `tiger-memory-mcp-server`, et de véritables identifiants de base de données.

```json
{
  "mcpServers": {
    "tiger-memory": {
      "command": "node",
      "args": [
        "/chemin/absolu/vers/tiger-memory-mcp-server/dist/index.js",
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

## Déploiement

Nous utilisons un chart Helm pour déployer sur Kubernetes. Consultez le répertoire `chart/` pour plus de détails.

Le service est accessible aux autres services du cluster via le nom DNS `tiger-memory-mcp-server.savannah-system.svc.cluster.local`.

### Configuration de la base de données

Création de l'utilisateur de base de données :

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Secrets

Exécutez les commandes suivantes pour créer les secrets scellés nécessaires. Assurez-vous de remplir les valeurs correctes.

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

Mettez à jour `./chart/values/dev.yaml` avec la sortie.
