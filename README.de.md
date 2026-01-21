# Tiger Memory MCP Server

Ein einfaches Speichersystem, das es LLMs ermöglicht, Informationen zu speichern und abzurufen. Es stellt LLMs gezielte Werkzeuge über das [Model Context Protocol](https://modelcontextprotocol.io/introduction) zur Verfügung.

## API

Alle Methoden sind als MCP-Tools und REST-API-Endpunkte verfügbar.

## Entwicklung

Repository klonen und den Server lokal ausführen.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Kompilierung

Führen Sie `npm i` aus, um Abhängigkeiten zu installieren und das Projekt zu kompilieren. Verwenden Sie `npm run watch`, um bei Änderungen automatisch neu zu kompilieren.

Erstellen Sie eine `.env`-Datei basierend auf der `.env.sample`-Datei.

```bash
cp .env.sample .env
```

### Testen

Der MCP Inspector ist sehr nützlich.

```bash
npm run inspector
```

| Feld          | Wert            |
| ------------- | --------------- |
| Transport-Typ | `STDIO`         |
| Befehl        | `node`          |
| Argumente     | `dist/index.js` |

#### Testen in Claude Desktop

Erstellen/bearbeiten Sie die Datei `~/Library/Application Support/Claude/claude_desktop_config.json` und fügen Sie einen Eintrag wie den folgenden hinzu. Achten Sie darauf, den absoluten Pfad zu Ihrem lokalen `tiger-memory-mcp-server`-Projekt und echte Datenbank-Anmeldedaten zu verwenden.

```json
{
  "mcpServers": {
    "tiger-memory": {
      "command": "node",
      "args": [
        "/absoluter/pfad/zu/tiger-memory-mcp-server/dist/index.js",
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

Der Dienst ist für andere Dienste im Cluster über den DNS-Namen `tiger-memory-mcp-server.savannah-system.svc.cluster.local` erreichbar.

### Datenbankeinrichtung

Erstellen des Datenbankbenutzers:

```sql
CREATE USER tiger_memory WITH PASSWORD 'geheim';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Secrets

Führen Sie Folgendes aus, um die erforderlichen Sealed Secrets zu erstellen. Achten Sie darauf, die korrekten Werte einzutragen.

```bash
kubectl -n savannah-system create secret generic tiger-memory-mcp-server-database \
  --dry-run=client \
  --from-literal=user="tiger_memory" \
  --from-literal=password="geheim" \
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
