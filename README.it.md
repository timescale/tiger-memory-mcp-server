# Tiger Memory MCP Server

Tiger Memory MCP Server e un sistema di memoria semplice ma potente, progettato specificamente per consentire ai Large Language Model (LLM) di memorizzare, gestire e recuperare informazioni in modo efficiente. Questo server fornisce un insieme di strumenti specializzati agli LLM attraverso il [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction), un protocollo standardizzato per la comunicazione tra modelli di linguaggio e servizi esterni.

## API

Tutti i metodi disponibili sono esposti sia come strumenti MCP (per l'integrazione diretta con i modelli di linguaggio) sia come endpoint REST API (per l'integrazione con applicazioni web e servizi esterni). Questa doppia esposizione garantisce massima flessibilita nell'utilizzo del server.

## Sviluppo

Questa sezione descrive come clonare il repository ed eseguire il server localmente per lo sviluppo e il testing.

Per iniziare, clonare il repository dalla piattaforma GitHub utilizzando il seguente comando:

```bash
git clone git@github.com:timescale/tiger-memory-mcp-server.git
```

Una volta completato il clone, entrare nella directory del progetto per procedere con la configurazione.

### Compilazione

Per installare tutte le dipendenze necessarie e compilare il progetto TypeScript in JavaScript, eseguire il seguente comando:

```bash
npm i
```

Questo comando installera automaticamente tutti i pacchetti elencati nel file `package.json` e avviera il processo di build.

Durante lo sviluppo attivo, e consigliato utilizzare la modalita watch che ricompila automaticamente il codice ogni volta che viene rilevata una modifica ai file sorgente:

```bash
npm run watch
```

Prima di avviare il server, e necessario configurare le variabili d'ambiente. Creare un file `.env` copiando il template fornito `.env.sample` e personalizzandolo con i propri valori:

```bash
cp .env.sample .env
```

Aprire il file `.env` appena creato e modificare le variabili secondo le proprie esigenze, in particolare le credenziali del database e altre configurazioni specifiche dell'ambiente.

### Test

Per testare il server MCP durante lo sviluppo, l'MCP Inspector e uno strumento estremamente utile che permette di interagire direttamente con gli strumenti esposti dal server e verificarne il corretto funzionamento.

Per avviare l'MCP Inspector, eseguire:

```bash
npm run inspector
```

Una volta avviato l'inspector, configurarlo con i seguenti parametri per connettersi al server:

| Campo          | Valore          | Descrizione                                            |
| -------------- | --------------- | ------------------------------------------------------ |
| Tipo Trasporto | `STDIO`         | Utilizza lo standard input/output per la comunicazione |
| Comando        | `node`          | Il runtime Node.js per eseguire il server              |
| Argomenti      | `dist/index.js` | Il punto di ingresso del server compilato              |

#### Test in Claude Desktop

Per testare l'integrazione del server con Claude Desktop, e necessario configurare l'applicazione per riconoscere e comunicare con il server MCP.

Individuare e modificare (o creare se non esiste) il file di configurazione di Claude Desktop situato al seguente percorso:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Aggiungere una voce di configurazione per il server Tiger Memory come mostrato nell'esempio seguente. E fondamentale sostituire il percorso placeholder con il percorso assoluto effettivo della propria installazione locale del progetto `tiger-memory-mcp-server`, e inserire le credenziali reali del proprio database:

```json
{
  "mcpServers": {
    "tiger-memory": {
      "command": "node",
      "args": [
        "/percorso/assoluto/a/tiger-memory-mcp-server/dist/index.js",
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

Dopo aver salvato il file di configurazione, riavviare Claude Desktop per applicare le modifiche. Il server Tiger Memory dovrebbe ora essere disponibile come strumento MCP all'interno dell'applicazione.

## Distribuzione

Per la distribuzione in ambienti di produzione, utilizziamo un Helm chart per effettuare il deploy su cluster Kubernetes. Tutti i file di configurazione e i template necessari sono disponibili nella directory `chart/` del repository. Consultare i file in quella directory per i dettagli specifici sulla configurazione del deployment.

Una volta distribuito, il servizio e accessibile agli altri servizi all'interno del cluster Kubernetes tramite il seguente nome DNS interno:

```
tiger-memory-mcp-server.savannah-system.svc.cluster.local
```

Questo permette ad altri microservizi nel cluster di comunicare con Tiger Memory senza la necessita di esporre il servizio all'esterno.

### Configurazione del database

Prima di poter utilizzare il server, e necessario configurare correttamente il database PostgreSQL. Questo include la creazione di un utente dedicato con i permessi appropriati.

Eseguire i seguenti comandi SQL per creare l'utente del database e assegnargli i permessi necessari:

```sql
-- Creazione dell'utente con password sicura
CREATE USER tiger_memory WITH PASSWORD 'secret';

-- Concessione dei permessi per creare schemi e tabelle
GRANT CREATE ON DATABASE tsdb TO tiger_memory;
```

**Nota importante:** Sostituire `'secret'` con una password sicura e complessa in ambienti di produzione. Non utilizzare mai password di esempio in sistemi reali.

### Segreti

La gestione sicura delle credenziali e delle informazioni sensibili avviene tramite Kubernetes Sealed Secrets. Questo approccio permette di memorizzare i segreti in modo sicuro nel repository Git senza esporre i valori in chiaro.

Eseguire i seguenti comandi per creare i sealed secret necessari al funzionamento del server. Prima di eseguire i comandi, assicurarsi di sostituire tutti i valori placeholder con le credenziali e i token reali:

**Secret per il database:**

```bash
kubectl -n savannah-system create secret generic tiger-memory-mcp-server-database \
  --dry-run=client \
  --from-literal=user="tiger_memory" \
  --from-literal=password="secret" \
  --from-literal=database="tsdb" \
  --from-literal=host="x.y.tsdb.cloud.timescale.com" \
  --from-literal=port="32467" \
  -o yaml | kubeseal -o yaml
```

**Secret per Logfire (monitoraggio e logging):**

```bash
# Ottenere il token da: https://logfire-us.pydantic.dev/tigerdata/tigerdata/settings/write-tokens
kubectl -n savannah-system create secret generic tiger-memory-mcp-server-logfire \
  --dry-run=client \
  --from-literal=token="pylf_v1_us_" \
  -o yaml | kubeseal -o yaml
```

**Secret per Tailscale (networking sicuro):**

```bash
# Ottenere la chiave da: https://login.tailscale.com/admin/settings/keys
kubectl -n savannah-system create secret generic tiger-memory-mcp-server-tailscale \
  --dry-run=client \
  --from-literal=authkey="tskey-auth-" \
  -o yaml | kubeseal -o yaml
```

Una volta generati i sealed secret, copiare l'output YAML di ciascun comando e aggiornare il file `./chart/values/dev.yaml` con i nuovi valori. Questo permettera a Helm di applicare correttamente i segreti durante il deployment.
