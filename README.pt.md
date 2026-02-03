# Servidor MCP de Memória Tiger

Um sistema de memória simples projetado para permitir que LLMs armazenem e recuperem informações. Isso fornece algumas ferramentas focadas para LLMs através do [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## API

Todos os métodos são expostos como ferramentas MCP e endpoints de API REST.

## Desenvolvimento

Clonando e executando o servidor localmente.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Construindo

Execute `npm i` para instalar dependências e construir o projeto. Use `npm run watch` para reconstruir ao fazer alterações.

Crie um arquivo `.env` baseado no arquivo `.env.sample`.

```bash
cp .env.sample .env
```

### Testando

O MCP Inspector é muito útil.

```bash
npm run inspector
```

| Campo              | Valor           |
| ------------------ | --------------- |
| Tipo de Transporte | `STDIO`         |
| Comando            | `node`          |
| Argumentos         | `dist/index.js` |

#### Testando no Claude Desktop

Crie/edite o arquivo `~/Library/Application Support/Claude/claude_desktop_config.json` para adicionar uma entrada como a seguinte, certificando-se de usar o caminho absoluto para o seu projeto local `tiger-memory-mcp-server` e credenciais reais do banco de dados.

```json
{
  "mcpServers": {
    "tiger-memory": {
      "command": "node",
      "args": [
        "/caminho/absoluto/para/tiger-memory-mcp-server/dist/index.js",
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

## Implantação

Usamos um chart Helm para implantar no Kubernetes. Veja o diretório `chart/` para detalhes.

O serviço é acessível a outros serviços no cluster através do nome DNS `tiger-memory-mcp-server.savannah-system.svc.cluster.local`.

### Configuração do banco de dados

Criando o usuário do banco de dados:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Secrets

Execute o seguinte para criar os sealed secrets necessários. Certifique-se de preencher os valores corretos.

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

Atualize `./chart/values/dev.yaml` com a saída.
