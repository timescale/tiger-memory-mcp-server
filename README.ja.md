# Tiger Memory MCP Server

LLMが情報を保存および取得できるように設計されたシンプルなメモリシステムです。[Model Context Protocol](https://modelcontextprotocol.io/introduction)を介して、LLMにいくつかの焦点を絞ったツールを提供します。

## API

すべてのメソッドは、MCPツールおよびREST APIエンドポイントとして公開されています。

## 開発

サーバーをローカルにクローンして実行します。

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### ビルド

`npm i`を実行して依存関係をインストールし、プロジェクトをビルドします。変更時に再ビルドするには`npm run watch`を使用します。

`.env.sample`ファイルをベースに`.env`ファイルを作成します。

```bash
cp .env.sample .env
```

### テスト

MCP Inspectorは非常に便利です。

```bash
npm run inspector
```

| フィールド | 値 |
| -------------- | --------------- |
| Transport Type | `STDIO`         |
| Command        | `node`          |
| Arguments      | `dist/index.js` |

#### Claude Desktopでのテスト

`~/Library/Application Support/Claude/claude_desktop_config.json`ファイルを作成/編集して、以下のようなエントリを追加します。ローカルの`tiger-memory-mcp-server`プロジェクトへの絶対パスと、実際のデータベース認証情報を使用してください。

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

## デプロイメント

Kubernetesへのデプロイには、Helmチャートを使用します。詳細は`chart/`ディレクトリを参照してください。

このサービスは、DNS名`tiger-memory-mcp-server.savannah-system.svc.cluster.local`を介してクラスタ内の他のサービスからアクセス可能です。

### データベースセットアップ

データベースユーザーの作成:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### シークレット

以下を実行して、必要なsealed secretsを作成します。正しい値を入力してください。

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

`./chart/values/dev.yaml`を出力で更新します。
