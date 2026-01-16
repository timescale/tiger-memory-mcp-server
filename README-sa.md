# व्याघ्रस्मृति MCP सेवकः (Tiger Memory MCP Server)

सरलः स्मृतिप्रणालिः यः LLM-एभ्यः सूचनानां संग्रहणं पुनःप्राप्तिं च साधयति। [मॉडल् कॉन्टेक्ट् प्रोटोकॉल्](https://modelcontextprotocol.io/introduction) इत्यनेन LLM-एभ्यः केचन केन्द्रितसाधनाः प्रदीयन्ते।

## API

सर्वाणि पद्धतीनि MCP साधनानां REST API अन्त्यबिन्दूनां च रूपेण प्रकटीकृतानि सन्ति।

## विकासः (Development)

स्थानीयतया सेवकस्य प्रतिलिपिकरणं चालनं च।

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### निर्माणम् (Building)

आश्रितानां स्थापनार्थं परियोजनानिर्माणाय च `npm i` चालयतु। परिवर्तनेषु पुनर्निर्माणाय `npm run watch` उपयुज्यताम्।

`.env.sample` सञ्चिकायाः आधारेण `.env` सञ्चिका निर्मीयताम्।

```bash
cp .env.sample .env
```

### परीक्षणम् (Testing)

MCP निरीक्षकः अत्यन्तं उपयोगी।

```bash
npm run inspector
```

| क्षेत्रम्     | मूल्यम्         |
| ------------- | --------------- |
| परिवहनप्रकारः | `STDIO`         |
| आदेशः         | `node`          |
| तर्काः        | `dist/index.js` |

#### Claude Desktop इत्यत्र परीक्षणम्

`~/Library/Application Support/Claude/claude_desktop_config.json` इति सञ्चिका निर्मीयतां सम्पाद्यतां वा येन निम्नलिखितवत् प्रविष्टिः योज्यते। स्वीयस्य स्थानीयस्य `tiger-memory-mcp-server` परियोजनायाः पूर्णमार्गः वास्तविकदत्तांशाधारप्रमाणपत्राणि च उपयुज्यन्ताम्।

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

## प्रयुक्तिः (Deployment)

Kubernetes इत्यत्र प्रयोक्तुं वयं Helm चार्ट् उपयुञ्महे। विवरणार्थं `chart/` निर्देशिका द्रष्टव्या।

समूहस्य अन्येभ्यः सेवाभ्यः अयं सेवा DNS नाम्ना `tiger-memory-mcp-server.savannah-system.svc.cluster.local` इत्यनेन प्राप्यते।

### दत्तांशाधारस्थापनम् (Database setup)

दत्तांशाधारउपयोक्तुः निर्माणम्:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### गुह्याणि (Secrets)

आवश्यकानां मुद्रितगुह्यानां निर्माणाय निम्नलिखितं चालयतु। सम्यक् मूल्यानि पूरयितुं न विस्मर्यताम्।

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

`./chart/values/dev.yaml` इति निर्गमेन अद्यतनं करोतु।
