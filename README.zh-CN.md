# Tiger Memory MCP 服务器

一个简单的内存系统，旨在允许大语言模型存储和检索信息。通过[模型上下文协议](https://modelcontextprotocol.io/introduction)为LLM提供一些专用工具。

## API

所有方法都作为 MCP 工具和 REST API 端点公开。

## 开发

克隆并在本地运行服务器。

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### 构建

运行 `npm i` 来安装依赖项并构建项目。使用 `npm run watch` 在更改时自动重新构建。

根据 `.env.sample` 文件创建一个 `.env` 文件。

```bash
cp .env.sample .env
```

### 测试

MCP Inspector 非常方便。

```bash
npm run inspector
```

| 字段          | 值              |
| -------------- | --------------- |
| Transport Type | `STDIO`         |
| Command        | `node`          |
| Arguments      | `dist/index.js` |

#### 在 Claude Desktop 中测试

创建/编辑文件 `~/Library/Application Support/Claude/claude_desktop_config.json` 添加如下条目，确保使用本地 `tiger-memory-mcp-server` 项目的绝对路径，以及真实的数据库凭据。

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

## 部署

我们使用 Helm chart 部署到 Kubernetes。详情请参阅 `chart/` 目录。

该服务可通过 DNS 名称 `tiger-memory-mcp-server.savannah-system.svc.cluster.local` 被集群中的其他服务访问。

### 数据库设置

创建数据库用户：

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### 密钥

运行以下命令创建必要的密封密钥。请务必填写正确的值。

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

使用输出更新 `./chart/values/dev.yaml`。
