# خادم Tiger Memory MCP

نظام ذاكرة بسيط مصمم للسماح لنماذج اللغة الكبيرة بتخزين واسترجاع المعلومات. يوفر هذا بعض الأدوات المركزة لنماذج اللغة الكبيرة عبر [بروتوكول سياق النموذج](https://modelcontextprotocol.io/introduction).

## واجهة برمجة التطبيقات

جميع الطرق متاحة كأدوات MCP ونقاط نهاية REST API.

## التطوير

استنساخ وتشغيل الخادم محلياً.

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

### البناء

قم بتشغيل `npm i` لتثبيت التبعيات وبناء المشروع. استخدم `npm run watch` لإعادة البناء عند التغييرات.

قم بإنشاء ملف `.env` بناءً على ملف `.env.sample`.

```bash
cp .env.sample .env
```

### الاختبار

أداة MCP Inspector مفيدة جداً.

```bash
npm run inspector
```

| الحقل          | القيمة          |
| -------------- | --------------- |
| نوع النقل      | `STDIO`         |
| الأمر          | `node`          |
| المعاملات      | `dist/index.js` |

#### الاختبار في تطبيق Claude Desktop

قم بإنشاء/تعديل الملف `~/Library/Application Support/Claude/claude_desktop_config.json` لإضافة إدخال مثل التالي، مع التأكد من استخدام المسار المطلق لمشروع `tiger-memory-mcp-server` المحلي الخاص بك، وبيانات اعتماد قاعدة البيانات الحقيقية.

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

## النشر

نستخدم مخطط Helm للنشر على Kubernetes. راجع دليل `chart/` للتفاصيل.

الخدمة متاحة للخدمات الأخرى في المجموعة عبر اسم DNS `tiger-memory-mcp-server.savannah-system.svc.cluster.local`.

### إعداد قاعدة البيانات

إنشاء مستخدم قاعدة البيانات:

```sql
CREATE USER tiger_memory WITH PASSWORD 'secret';
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

### الأسرار

قم بتشغيل الأمر التالي لإنشاء الأسرار المختومة اللازمة. تأكد من ملء القيم الصحيحة.

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

قم بتحديث `./chart/values/dev.yaml` بالمخرجات.
