# PROJECT.md — IoT MQTT Simulator

> Estado canônico do projeto. Gerado pelo Discovery Agent em 2026-07-22.
> Código-fonte é a fonte de verdade — este documento segue o código.

---

## 1. Visão Geral

Plataforma fullstack de **simulação e monitoramento IoT** industrial que:

- Simula sensores industriais (temperatura, pressão, umidade, vibração) publicando dados via MQTT
- Processa mensagens MQTT em tempo real, persiste no MongoDB e gera alertas
- Expõe API REST + WebSocket para consumo pelo dashboard
- Exibe dados em tempo real via dashboard Vue.js com gráficos ECharts

**Status:** Em desenvolvimento ativo  
**Versão:** 1.0.0  
**SDD-Ready:** Sim (bootstrapado em 2026-07-22)

---

## 2. Domínio de Negócio

**Domínio:** Monitoramento industrial IoT (fábrica/planta industrial)  
**Problema:** Visualização e alertas em tempo real de sensores de chão de fábrica  
**Usuário-alvo:** Operadores e engenheiros de manutenção industrial  

**Entidades de negócio:**
| Entidade | Descrição |
|---|---|
| Sensor | Dispositivo físico (ou simulado) que mede grandezas físicas |
| Reading | Leitura pontual de um sensor com timestamp |
| Alert | Notificação gerada quando leitura ultrapassa threshold |
| Threshold | Limiar configurável de warning/critical por tipo de sensor |

---

## 3. Arquitetura

**Estilo:** Microserviços em containers Docker com comunicação via MQTT (pub/sub) e REST+WebSocket  
**Perfil SDD:** microservice

```
┌─────────────┐     MQTT pub      ┌──────────────────────┐
│  Simulator  │ ─────────────────► │   Eclipse Mosquitto  │
│ (Node ESM)  │  factory/sensors/  │     (broker:1883)    │
└─────────────┘   {type}/{id}      └──────────┬───────────┘
                                              │ MQTT sub
                                              ▼
                                   ┌──────────────────────┐
                                   │    API (Express)     │
                                   │     (api:3000)       │
                                   │  ┌───────────────┐   │
                                   │  │ mqttService   │   │
                                   │  │ (subscriber)  │   │
                                   │  └───────┬───────┘   │
                                   │          │ persist   │
                                   │  ┌───────▼───────┐   │
                                   │  │   MongoDB     │   │
                                   │  │   :27017      │   │
                                   │  └───────────────┘   │
                                   │  ┌───────────────┐   │
                                   │  │  Socket.io    │   │
                                   │  │  (broadcast)  │   │
                                   │  └───────┬───────┘   │
                                   │  Prometheus :9090    │
                                   └──────────┬───────────┘
                                              │ REST + WS
                                              ▼
                                   ┌──────────────────────┐
                                   │   Dashboard (Vue3)   │
                                   │   (dashboard:5173)   │
                                   └──────────────────────┘
```

### Serviços

| Serviço | Tecnologia | Porta | Propósito |
|---|---|---|---|
| broker | Eclipse Mosquitto 2.0 | 1883, 9001(WS) | MQTT message broker |
| mongo | MongoDB 7.0 | 27017 | Persistência de timeseries |
| api | Node.js + Express | 3000, 9090 | REST API + WebSocket + MQTT consumer |
| simulator | Node.js ESM | — | Gerador de dados falsos |
| dashboard | Vue 3 + Vite | 5173 | Interface de monitoramento |
| nginx | nginx:alpine | 80, 443 | Proxy reverso (apenas produção) |

---

## 4. Stack Tecnológico

### API (services/api) — CommonJS
| Dependência | Versão | Propósito |
|---|---|---|
| express | ^4.19.2 | Framework HTTP |
| mongoose | ^8.3.4 | ODM MongoDB |
| mqtt | ^5.3.4 | Cliente MQTT |
| socket.io | ^4.7.5 | WebSocket real-time |
| winston | ^3.13.0 | Logging estruturado |
| prom-client | ^15.1.3 | Métricas Prometheus |
| dotenv | ^16.4.5 | Variáveis de ambiente |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| helmet | ^7.1.0 | Headers de segurança |
| express-rate-limit | ^7.2.0 | Rate limiting |
| joi | ^17.13.1 | Validação de schema |
| compression | ^1.7.4 | Compressão gzip |
| morgan | ^1.10.0 | HTTP request logger |
| uuid | ^9.0.1 | Geração de UUIDs |

**Dev:** jest ^29.7, supertest ^7, mongodb-memory-server ^9.3, nodemon ^3.1

### Simulator (services/simulator) — ESM
| Dependência | Versão | Propósito |
|---|---|---|
| mqtt | ^5.3.4 | Publicação MQTT |
| dotenv | ^16.4.5 | Variáveis de ambiente |

**Dev:** jest ^29.7 (com experimental-vm-modules)

### Dashboard (services/dashboard) — ESM
| Dependência | Versão | Propósito |
|---|---|---|
| vue | ^3.4.27 | Framework frontend |
| vue-router | ^4.3.2 | Roteamento SPA |
| pinia | ^2.1.7 | Gerenciamento de estado |
| echarts | ^5.5.0 | Gráficos |
| vue-echarts | ^6.7.3 | Wrapper Vue para ECharts |
| socket.io-client | ^4.7.5 | WebSocket cliente |
| axios | ^1.7.2 | Cliente HTTP |
| dayjs | ^1.11.11 | Manipulação de datas |
| clsx | ^2.1.1 | Classes CSS condicionais |
| tailwindcss | ^3.4.4 | CSS utility-first |

**Dev:** vite ^5.3, @vitejs/plugin-vue ^5, vitest ^1.6, @vue/test-utils ^2.4, jsdom ^24, @pinia/testing ^0.1

---

## 5. Estrutura de Pastas

```
/
├── PROJECT.md               # Estado canônico do projeto
├── AGENTS.md                # Instrução para todos os agentes IA
├── GEMINI.md                # Instrução específica Gemini
├── CLAUDE.MD                # Instrução específica Claude (existente)
├── docker-compose.yml       # Ambiente de desenvolvimento
├── docker-compose.prod.yml  # Ambiente de produção
├── .env.example             # Template de variáveis de ambiente
├── .github/workflows/       # CI/CD (a implementar)
├── agents/                  # Definições dos agentes SDD
│   ├── workflows/           # Fluxos de trabalho
│   └── profiles/            # Perfis de projeto
├── adr/                     # Architecture Decision Records
├── decisions/               # Decisões de negócio
├── docs/                    # Documentação adicional
├── knowledge/               # Base de conhecimento
│   ├── architecture/
│   ├── business/
│   ├── glossary/
│   ├── integrations/
│   ├── stack/
│   ├── patterns/
│   └── decisions/
├── reviews/                 # Revisões de implementação
├── specs/                   # Especificações de features
├── standards/               # Padrões de desenvolvimento
├── tasks/                   # Tasks de implementação
├── templates/               # Templates SDD
└── services/
    ├── api/                 # Node.js Express API
    │   └── src/
    │       ├── app.js       # Factory Express app
    │       ├── index.js     # Bootstrap (MongoDB + HTTP + Socket.io + MQTT)
    │       ├── config/      # Configuração centralizada
    │       ├── middleware/  # errorHandler, requestLogger, validate
    │       ├── models/      # Reading.js, Alert.js (Mongoose)
    │       ├── routes/      # readings, sensors, alerts, health, metrics
    │       ├── services/    # mqttService, alertService, metricsService, readingService
    │       ├── utils/       # logger.js, thresholds.js
    │       └── websocket/   # socketServer.js
    ├── simulator/           # Node.js ESM simulator
    │   └── src/
    │       ├── index.js     # Main loop
    │       ├── config.js    # Configuração
    │       └── sensors/     # temperatureSensor, pressureSensor, humiditySensor, vibrationSensor
    ├── dashboard/           # Vue 3 SPA
    │   └── src/
    │       ├── App.vue
    │       ├── main.js
    │       ├── api/         # Clientes HTTP axios
    │       ├── components/  # alerts/, charts/, layout/, sensors/, ui/
    │       ├── composables/ # Vue composables
    │       ├── router/      # vue-router
    │       ├── stores/      # Pinia: alerts.js, sensors.js, connection.js
    │       ├── styles/      # CSS global
    │       └── views/       # DashboardView, AlertsView, HistoryView, SensorsView
    └── broker/              # Mosquitto config
        ├── mosquitto.conf
        └── passwd
```

---

## 6. Ambiente de Execução

**Runtime:** Node.js (versão não fixada — recomendado >=20 LTS)  
**Package Manager:** npm  
**Container Runtime:** Docker + Docker Compose  

### Comandos

```bash
# Desenvolvimento
docker compose up -d

# Produção
docker compose -f docker-compose.prod.yml up -d

# API tests
cd services/api && npm test
cd services/api && npm run test:coverage

# Simulator tests
cd services/simulator && npm test

# Dashboard tests
cd services/dashboard && npm test
cd services/dashboard && npm run test:coverage
```

---

## 7. Variáveis de Ambiente

Veja `.env.example` para lista completa. Variáveis críticas:

| Variável | Padrão | Descrição |
|---|---|---|
| MQTT_BROKER_HOST | broker | Host do broker MQTT |
| MQTT_BROKER_PORT | 1883 | Porta MQTT |
| MQTT_USERNAME | iotuser | Usuário MQTT |
| MQTT_PASSWORD | iotpassword | Senha MQTT |
| MONGODB_URI | mongodb://mongo:27017/iot_dashboard | URI MongoDB |
| NODE_ENV | development | Ambiente |
| API_PORT | 3000 | Porta da API |
| CORS_ORIGINS | http://localhost:5173 | Origens permitidas |
| TEMP_WARN_THRESHOLD | 70 | Threshold warning temperatura (°C) |
| TEMP_CRITICAL_THRESHOLD | 90 | Threshold critical temperatura (°C) |
| PRESSURE_WARN_THRESHOLD | 8.5 | Threshold warning pressão (bar) |
| PRESSURE_CRITICAL_THRESHOLD | 10 | Threshold critical pressão (bar) |
| HUMIDITY_WARN_THRESHOLD | 80 | Threshold warning umidade (%) |
| HUMIDITY_CRITICAL_THRESHOLD | 90 | Threshold critical umidade (%) |
| VIBRATION_WARN_THRESHOLD | 4.5 | Threshold warning vibração (mm/s) |
| VIBRATION_CRITICAL_THRESHOLD | 6.0 | Threshold critical vibração (mm/s) |
| SIMULATOR_INTERVAL_MS | 2000 | Intervalo de publicação (ms) |
| SIMULATOR_SENSORS_COUNT | 8 | Quantidade total de sensores |
| SIMULATOR_ANOMALY_PROBABILITY | 0.05 | Probabilidade de anomalia |
| LOG_LEVEL | info | Nível de log Winston |
| METRICS_ENABLED | true | Habilitar métricas Prometheus |
| METRICS_PORT | 9090 | Porta métricas Prometheus |
| VITE_API_URL | http://localhost:3000/api/v1 | URL API para dashboard |
| VITE_WS_URL | http://localhost:3000 | URL WebSocket |
| AWS_IOT_ENDPOINT | — | Endpoint AWS IoT Core (produção) |

---

## 8. APIs

### REST API (api:3000)

**Base URL dev:** `http://localhost:3000`

| Método | Rota | Descrição |
|---|---|---|
| GET | /health | Health check |
| GET | /metrics | Métricas Prometheus |
| GET | /api/v1/readings | Leituras paginadas com filtros |
| GET | /api/v1/readings/latest | Última leitura por sensor |
| GET | /api/v1/readings/stats | Estatísticas agregadas |
| GET | /api/v1/sensors | Lista sensores únicos |
| GET | /api/v1/sensors/:id | Histórico de um sensor |
| GET | /api/v1/alerts | Alertas paginados com filtros |
| GET | /api/v1/alerts/summary | Resumo de alertas |
| PATCH | /api/v1/alerts/:id/resolve | Resolver alerta |

**Parâmetros de query para readings:** sensorId, type, status, from, to, limit (max 1000), page  
**Parâmetros de query para alerts:** sensorId, level, resolved, from, to, limit, page

### MQTT Topics

| Tópico | Direção | QoS | Descrição |
|---|---|---|---|
| factory/sensors/temperature/+ | pub (simulator) → sub (api) | 1 | Leituras de temperatura |
| factory/sensors/pressure/+ | pub (simulator) → sub (api) | 1 | Leituras de pressão |
| factory/sensors/humidity/+ | pub (simulator) → sub (api) | 1 | Leituras de umidade |
| factory/sensors/vibration/+ | pub (simulator) → sub (api) | 1 | Leituras de vibração |

**Payload MQTT:**
```json
{
  "sensorId": "TEMP-01",
  "value": 72.5,
  "unit": "°C",
  "timestamp": "2026-07-22T19:00:00.000Z",
  "isAnomaly": false,
  "metadata": {}
}
```

### WebSocket Events (Socket.io)

| Evento | Direção | Payload |
|---|---|---|
| reading:new | server → client | Reading object com status |
| alert:new | server → client | Alert object |

---

## 9. Modelos de Dados

### Reading (MongoDB Timeseries)
```js
{
  sensorId:  String (required, indexed),
  type:      enum['temperature','pressure','humidity','vibration'],
  value:     Number (required),
  unit:      String (required),
  status:    enum['normal','warning','critical'] default:'normal',
  isAnomaly: Boolean default:false,
  metadata:  Mixed default:{},
  timestamp: Date (timeField, indexed)
}
// TTL: 7 dias (expireAfterSeconds: 604800)
// timeField: timestamp | metaField: sensorId | granularity: seconds
```

### Alert
```js
{
  sensorId:   String (required, indexed),
  type:       String (required),
  level:      enum['warning','critical'] (required),
  value:      Number (required),
  unit:       String,
  threshold:  Number,
  message:    String (required),
  resolved:   Boolean default:false,
  resolvedAt: Date,
  timestamp:  Date (indexed)
}
```

---

## 10. Segurança

- **MQTT:** Autenticação usuário/senha (arquivo passwd Mosquitto)
- **API:** helmet (headers), CORS configurável, rate-limit 300 req/min por IP
- **Secrets:** variáveis de ambiente via .env (nunca commitadas)
- **AWS IoT Core (produção):** mTLS com certificados x509
- **MongoDB:** sem autenticação em dev (isolado em rede Docker)
- **Produção:** nginx como proxy reverso com TLS termination

---

## 11. Observabilidade

- **Logs:** Winston (JSON format, configurável via LOG_LEVEL)
- **Métricas Prometheus** (porta 9090):
  - `mqtt_messages_total` — contador por topic/sensor_type
  - `sensor_value` — gauge por sensor_id/sensor_type/unit
  - `alerts_total` — contador por level/sensor_type
  - `http_request_duration_seconds` — histograma por method/route/status_code
  - Métricas padrão Node.js (process, memory, event loop)
- **Health Check:** GET /health

---

## 12. CI/CD e Deploy

- **CI:** GitHub Actions (.github/workflows/) — **a implementar**
- **Dev:** `docker compose up -d`
- **Prod:** `docker compose -f docker-compose.prod.yml up -d`
- **Build imagens:** Multi-stage Dockerfile (development/production targets)
- **AWS IoT Core:** integração planejada (infra/aws vazio)
- **nginx:** configuração planejada (infra/nginx vazio)

---

## 13. Estratégia de Testes

| Serviço | Framework | Cobertura mínima |
|---|---|---|
| api | Jest + supertest + mongodb-memory-server | 90% lines/functions, 85% branches |
| simulator | Jest (experimental-vm-modules) | — |
| dashboard | Vitest + @vue/test-utils + jsdom | — |

**Estrutura de testes API:**
- `tests/unit/` — utils, services
- `tests/integration/routes/` — testes de rotas com supertest
- `tests/setup.js` — setup global

---

## 14. Padrões de Código

- **API:** CommonJS (require/module.exports), async/await, Express Router factory
- **Simulator:** ES Modules (import/export)
- **Dashboard:** ES Modules, Vue 3 Composition API, `<script setup>` preferível
- **Commits:** Conventional Commits (feat, fix, chore, docs, test, refactor)
- **Validação:** Joi para inputs HTTP
- **Logging:** sempre via Winston (nunca console.log em produção na API)
- **Erros:** errorHandler centralizado, never expose stack em produção

---

## 15. Limitações Conhecidas

- MongoDB sem autenticação em dev (risco se porta 27017 exposta)
- Sem retry persistente para mensagens MQTT perdidas
- Sem paginação cursor-based (somente offset)
- Thresholds globais por tipo (não por sensor individual)
- Sem mecanismo de deduplicação de alertas (alerta novo a cada leitura fora do limite)
- AWS IoT Core e nginx (produção) não implementados
- GitHub Actions CI/CD não implementado
- Sem autenticação/autorização na API REST

---

## 16. Tecnologias Intencionalmente NÃO Utilizadas

- **TypeScript:** projeto usa JS puro para simplicidade
- **GraphQL:** REST + WebSocket cobre os casos de uso
- **Redis:** MongoDB timeseries suficiente para o volume atual
- **Kafka/RabbitMQ:** MQTT broker suficiente para o escopo
- **Kubernetes:** Docker Compose suficiente para o escopo atual
- **ORM SQL:** MongoDB é a escolha para dados de timeseries IoT
