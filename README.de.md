# Tiger Memory MCP Server

Ein einfaches Speichersystem, das entwickelt wurde, um LLMs das Speichern und Abrufen von Informationen zu ermöglichen. Dies stellt einige fokussierte Werkzeuge für LLMs über das [Model Context Protocol](https://modelcontextprotocol.io/introduction) bereit.

## API

Alle Methoden werden als MCP-Tools und REST-API-Endpunkte bereitgestellt.

## Entwicklung

Klonen und lokales Ausführen des Servers.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Build

Führen Sie `npm i` aus, um Abhängigkeiten zu installieren und das Projekt zu erstellen. Verwenden Sie `npm run watch`, um bei Änderungen automatisch neu zu erstellen.

Erstellen Sie eine `.env`-Datei basierend auf der `.env.sample`-Datei.

```bash
cp .env.sample .env
```

### Testen

Der MCP Inspector ist sehr praktisch.

```bash
npm run inspector
```

| Feld           | Wert            |
| -------------- | --------------- |
| Transport Type | `STDIO`         |
| Command        | `node`          |
| Arguments      | `dist/index.js` |

#### Testen in Claude Desktop

Erstellen/bearbeiten Sie die Datei `~/Library/Application Support/Claude/claude_desktop_config.json`, um einen Eintrag wie den folgenden hinzuzufügen. Stellen Sie sicher, dass Sie den absoluten Pfad zu Ihrem lokalen `tiger-memory-mcp-server`-Projekt und echte Datenbank-Anmeldeinformationen verwenden.

```json
{
  "mcpServers": {
    "tiger-memory": {
      "command": "node",
      "args": [
        "/absoluter/pfad/zum/tiger-memory-mcp-server/dist/index.js",
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

## Bereitstellung

Wir verwenden ein Helm-Chart für die Bereitstellung auf Kubernetes. Details finden Sie im Verzeichnis `chart/`.

Der Dienst ist für andere Dienste im Cluster über den DNS-Namen `tiger-memory-mcp-server.savannah-system.svc.cluster.local` zugänglich.

### Datenbank-Setup

Erstellen des Datenbankbenutzers:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Secrets

Führen Sie Folgendes aus, um die erforderlichen Sealed Secrets zu erstellen. Stellen Sie sicher, dass Sie die richtigen Werte eintragen.

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

Aktualisieren Sie `./chart/values/dev.yaml` mit der Ausgabe.
