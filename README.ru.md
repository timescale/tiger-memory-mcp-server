# Tiger Memory MCP Server

Простая система памяти, разработанная для хранения и извлечения информации большими языковыми моделями (LLM). Предоставляет набор специализированных инструментов для LLM через [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## API

Все методы доступны как инструменты MCP и конечные точки REST API.

## Разработка

Клонирование и локальный запуск сервера.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### Сборка

Выполните `npm i` для установки зависимостей и сборки проекта. Используйте `npm run watch` для автоматической пересборки при изменениях.

Создайте файл `.env` на основе файла `.env.sample`.

```bash
cp .env.sample .env
```

### Тестирование

MCP Inspector очень удобен для тестирования.

```bash
npm run inspector
```

| Поле           | Значение        |
| -------------- | --------------- |
| Transport Type | `STDIO`         |
| Command        | `node`          |
| Arguments      | `dist/index.js` |

#### Тестирование в Claude Desktop

Создайте или отредактируйте файл `~/Library/Application Support/Claude/claude_desktop_config.json`, добавив запись следующего вида. Обязательно укажите абсолютный путь к вашему локальному проекту `tiger-memory-mcp-server` и реальные учетные данные базы данных.

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

## Развертывание

Мы используем Helm-чарт для развертывания в Kubernetes. Подробности см. в директории `chart/`.

Сервис доступен другим сервисам в кластере по DNS-имени `tiger-memory-mcp-server.savannah-system.svc.cluster.local`.

### Настройка базы данных

Создание пользователя базы данных:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### Секреты

Выполните следующую команду для создания необходимых sealed secrets. Обязательно укажите правильные значения.

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

Обновите `./chart/values/dev.yaml` с полученным выводом.
