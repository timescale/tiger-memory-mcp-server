# Tiger Memory MCP Сервер

Проста система пам'яті, розроблена для того, щоб дозволити LLM зберігати та отримувати інформацію. Це надає деякі цільові інструменти для LLM через [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## API

Усі методи доступні як інструменти MCP та REST API endpoints.

## Розробка

Клонування та запуск сервера локально.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Збірка

Виконайте `npm i` для встановлення залежностей та збірки проєкту. Використовуйте `npm run watch` для перезбірки при змінах.

Створіть файл `.env` на основі файлу `.env.sample`.

```bash
cp .env.sample .env
```

### Тестування

MCP Inspector дуже зручний.

```bash
npm run inspector
```

| Поле           | Значення        |
| -------------- | --------------- |
| Тип транспорту | `STDIO`         |
| Команда        | `node`          |
| Аргументи      | `dist/index.js` |

#### Тестування в Claude Desktop

Створіть/відредагуйте файл `~/Library/Application Support/Claude/claude_desktop_config.json`, щоб додати запис наступного вигляду, переконавшись, що використовуєте абсолютний шлях до вашого локального проєкту `tiger-memory-mcp-server` та справжні облікові дані бази даних.

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

## Розгортання

Ми використовуємо Helm chart для розгортання в Kubernetes. Дивіться деталі в директорії `chart/`.

Сервіс доступний для інших сервісів в кластері через DNS ім'я `tiger-memory-mcp-server.savannah-system.svc.cluster.local`.

### Налаштування бази даних

Створення користувача бази даних:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Секрети

Виконайте наступне для створення необхідних sealed secrets. Обов'язково заповніть правильні значення.

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

Оновіть `./chart/values/dev.yaml` результатом виконання.
