# Tiger Memory MCP Server

Ein einfaches Gedächtnissystem, das es LLMs ermöglicht, Informationen zu speichern und abzurufen. Dies stellt LLMs einige fokussierte Werkzeuge über das [Model Context Protocol](https://modelcontextprotocol.io/introduction) zur Verfügung.

## API

Alle Methoden werden als MCP-Tools und REST-API-Endpunkte bereitgestellt.

## Entwicklung

Klonen und lokales Ausführen des Servers.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Erstellen

Führen Sie `npm i` aus, um Abhängigkeiten zu installieren und das Projekt zu erstellen. Verwenden Sie `npm run watch`, um bei Änderungen neu zu erstellen.

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

Erstellen/bearbeiten Sie die Datei `~/Library/Application Support/Claude/claude_desktop_config.json`, um einen Eintrag wie den folgenden hinzuzufügen. Stellen Sie sicher, dass Sie den absoluten Pfad zu Ihrem lokalen `tiger-memory-mcp-server`-Projekt und echte Datenbankzugangsdaten verwenden.

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

## Bereitstellung

Wir verwenden ein Helm-Chart zur Bereitstellung in Kubernetes. Siehe das Verzeichnis `chart/` für Details.

Der Dienst ist für andere Dienste im Cluster über den DNS-Namen `tiger-memory-mcp-server.savannah-system.svc.cluster.local` erreichbar.

### Datenbankeinrichtung

Erstellen des Datenbankbenutzers:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Geheimnisse

Führen Sie den folgenden Befehl aus, um die erforderlichen Sealed Secrets zu erstellen. Stellen Sie sicher, dass Sie die richtigen Werte eintragen.

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
