# 📋 Plano de Implementação — IoT MQTT Simulator

> Estado canônico do roadmap de desenvolvimento.  
> Gerado em: 2026-07-23 | Baseado em: PROJECT.md + SPEC-001 + TASK-001 + inspeção direta do código-fonte.  
> Atualizar este documento a cada task concluída.

---

## 🔍 Diagnóstico do Estado Atual

### ✅ Implementado e Funcional

| Área | Artefato | Status |
|---|---|---|
| **Infraestrutura** | `docker-compose.yml` + `docker-compose.prod.yml` | ✅ Completo |
| **Broker** | Mosquitto conf + passwd | ✅ Completo |
| **API — Modelos** | `Reading.js`, `Alert.js` (Mongoose timeseries) | ✅ Completo |
| **API — Repository Pattern** | `readingRepository.js`, `alertRepository.js` | ✅ Implementado |
| **API — Strategy Pattern** | `thresholdStrategy.js` (4 estratégias + contexto) | ✅ Implementado |
| **API — Response Formatter** | `responseFormatter.js` (`successResponse`) | ✅ Implementado |
| **API — Error Handler** | `errorHandler.js` (contrato `{ success, error }`) | ✅ Implementado |
| **API — Services** | `readingService.js`, `alertService.js` (usam repositórios) | ✅ Implementado |
| **API — MQTT Service** | `mqttService.js` (subscribe + persist + alert + broadcast) | ✅ Implementado |
| **API — Rotas** | `readings.js`, `alerts.js`, `sensors.js`, `health.js`, `metrics.js` | ✅ Implementado |
| **API — Testes Unitários** | `readingService.test.js`, `alertService.test.js` | ✅ Existem |
| **API — Testes Integração** | `readings.test.js`, `alerts.test.js`, `sensors.test.js`, `health.test.js`, `metrics.test.js` | ✅ Existem |
| **Simulator** | `index.js` + 4 sensores + `config.js` | ✅ Completo |
| **Simulator — Testes** | `sensors.test.js` | ✅ Existe |
| **Dashboard — Views** | `DashboardView`, `AlertsView`, `HistoryView`, `SensorsView` | ✅ Implementadas |
| **Dashboard — Stores** | `sensors.js`, `alerts.js`, `connection.js`, `notification.js` | ✅ Implementadas |
| **Dashboard — API Client** | `client.js` com interceptors Axios | ✅ Implementado |
| **Dashboard — UI Components** | `BaseButton`, `BaseCard`, `ToastNotification`, `MetricBadge`, etc. | ✅ Implementados |
| **Dashboard — Testes Stores** | `sensors.test.js`, `alerts.test.js`, `connection.test.js` | ✅ Existem |
| **CI/CD** | `.github/workflows/ci.yml` | ✅ Arquivo existe |
| **ADRs** | ADR-001 a ADR-005 | ✅ Documentados |

---

### ❌ Gaps Identificados

#### 🔴 Bugs / Inconsistências de Implementação

| # | ID | Problema | Arquivo | Status |
|---|---|---|---|---|
| 1 | **B1** | Rota `readings.js` chama `Reading` diretamente — ignora `readingService` | `services/api/src/routes/readings.js` | ✅ Corrigido |
| 2 | **B2** | Store `sensors.js` usa `response.data.data` (duplo) — interceptor já retorna envelope | `services/dashboard/src/stores/sensors.js` L26, L37 | ✅ Corrigido |
| 3 | **B3** | Store `alerts.js` tem a mesma inconsistência de duplo `.data` | `services/dashboard/src/stores/alerts.js` | ✅ Corrigido |
| 4 | **B4** | Testes de integração não validam `success: true` no envelope da resposta | `services/api/tests/integration/routes/*.test.js` | ✅ Corrigido |
| 5 | **B5** | Testes Vue de components e composables estão vazios (só `.gitkeep`) | `services/dashboard/tests/unit/components/` | 🔴 Aberto |

#### 🟠 Funcionalidades Ausentes

| # | ID | Feature | Prioridade | Status |
|---|---|---|---|---|
| 1 | **F1** | Deduplicação de alertas (alerta novo a cada leitura fora do limite) | Alta | 🔴 Aberto |
| 2 | **F2** | Thresholds por sensor individual (atual é global por tipo) | Média | 🔴 Aberto |
| 3 | **F3** | Autenticação/autorização na API REST (JWT) | Alta | 🔴 Aberto |
| 4 | **F4** | Retry persistente para mensagens MQTT perdidas | Baixa | 🔴 Aberto |
| 5 | **F5** | Paginação cursor-based (atual é offset) | Baixa | 🔴 Aberto |
| 6 | **F6** | AWS IoT Core — integração (`infrastructure/aws/` vazio) | Baixa | 🔴 Aberto |
| 7 | **F7** | nginx reverse proxy (`infrastructure/nginx/` vazio) | Média | 🔴 Aberto |

#### 🟡 Infraestrutura / DevOps Ausente

| # | ID | Item | Estado | Status |
|---|---|---|---|---|
| 1 | **I1** | CI GitHub Actions — workflow existe mas não foi validado com sucesso | `.github/workflows/ci.yml` | 🟡 Não validado |
| 2 | **I2** | CD GitHub Actions (deploy automático) | — | 🔴 Não implementado |
| 3 | **I3** | nginx config para produção | `infrastructure/nginx/` | 🔴 Diretório vazio |
| 4 | **I4** | AWS IoT Core config | `infrastructure/aws/` | 🔴 Diretório vazio |
| 5 | **I5** | Stack Grafana/Prometheus completa | `docker-compose.yml` | 🟡 Parcial |

#### 🔵 Documentação Ausente

| # | ID | Item | Status |
|---|---|---|---|
| 1 | **D1** | README.md de onboarding completo | 🟡 Básico |
| 2 | **D2** | OpenAPI/Swagger para todos os endpoints | 🔴 Ausente |
| 3 | **D3** | Guia de testes e como ver cobertura | 🔴 Ausente |
| 4 | **D4** | CONTRIBUTING.md | 🔴 Ausente |
| 5 | **D5** | CHANGELOG.md | 🔴 Ausente |

---

## 🗺️ Roteiro SDLC — 5 Fases / 13 Tasks

> Fluxo obrigatório: **Discovery → Architecture → Specification → Human Approval → Tasks → Implementation → Testing → Review → Refactor → Documentation → Release**

---

### FASE 1 — Estabilização (Correção de Bugs) 🔴

> **Objetivo:** Garantir que o que existe funciona corretamente antes de avançar.

> **💡 Regra de Refatoração (SDD):** Ao refatorar rotas para extrair lógica para Services (padrão Repository), **NUNCA** remova às cegas os imports dos Models (Mongoose) dos arquivos de teste de integração. Os testes de integração (especialmente os blocos `beforeEach`) frequentemente utilizam chamadas diretas como `Model.insertMany()` para simular o banco de dados. Remover esse import causará `ReferenceError` silencioso ou imediato na CI.

#### TASK-002 — Corrigir rota `readings.js` para usar `readingService` (B1)

- **Status:** ✅ **Concluído** (commit `6c2d7db`)
- **Prioridade:** P0 (crítico)
- **Arquivo:** `services/api/src/routes/readings.js`
- **O que fazer:**
  - Substituir chamadas diretas `Reading.find()` e `Reading.aggregate()` pelo `readingService`
  - Manter envelope `successResponse`
  - Garantir que todos os testes de integração continuam passando
- **Critério de aceite:** Rota não importa nenhum model Mongoose diretamente

---

#### TASK-003 — Corrigir duplo `.data` nas stores do dashboard (B2, B3)

- **Status:** ✅ **Concluído** (commit `6c2d7db`)
- **Prioridade:** P0 (causa bug em runtime)
- **Arquivos:** `services/dashboard/src/stores/sensors.js`, `services/dashboard/src/stores/alerts.js`
- **O que fazer:**
  - O interceptor Axios em `client.js` já retorna `response.data` (envelope `{ success, data, meta }`)
  - As stores devem acessar `.data` (uma vez), não `.data.data` (duas vezes)
  - Verificar todas as stores para o mesmo padrão
- **Critério de aceite:** `npm test` no dashboard passa; dados carregam no browser

---

#### TASK-004 — Completar testes de contrato da API (B4)

- **Status:** ✅ **Concluído**
- **Prioridade:** P1
- **Arquivos:** `services/api/tests/integration/routes/*.test.js`, `tests/unit/utils/`
- **O que fazer:**
  - Adicionar `expect(res.body.success).toBe(true)` em todos os testes 2xx
  - Adicionar `expect(res.body.success).toBe(false)` em todos os testes de erro
  - Adicionar testes unitários para `thresholdStrategy.js` e `responseFormatter.js`
- **Critério de aceite:** Coverage ≥90% na API com contratos validados

---

#### TASK-005 — Testes de componentes Vue e composables (B5)

- **Status:** 🔴 Aberto
- **Prioridade:** P1
- **Arquivos:** `services/dashboard/tests/unit/components/`, `services/dashboard/tests/unit/composables/`
- **O que fazer:**
  - Criar testes `@vue/test-utils` para `BaseButton`, `BaseCard`, `ToastNotification`
  - Criar testes para o composable `useSocket`
  - Criar testes para `MetricBadge`, `ConnectionStatus`
- **Critério de aceite:** Testes criados, `npm test` passa no dashboard

---

### FASE 2 — Qualidade e Cobertura 🟡

> **Objetivo:** CI verde, cobertura adequada, features de negócio críticas.

#### TASK-006 — Validar e Fixar CI GitHub Actions (I1)

- **Status:** 🟡 Não validado
- **Prioridade:** P1
- **Arquivo:** `.github/workflows/ci.yml`
- **O que fazer:**
  - Executar todos os jobs localmente simulando o ambiente CI
  - Verificar `mongodb-memory-server` no job `api`
  - Verificar `--experimental-vm-modules` no job `simulator`
  - Verificar `vite build` no job `dashboard`
  - Corrigir eventuais falhas de configuração
- **Critério de aceite:** Push na branch `develop` gera CI verde

---

#### TASK-007 — Deduplicação de Alertas (F1)

- **Status:** 🔴 Aberto
- **Prioridade:** P1 (negócio crítico)
- **Arquivos:** `services/api/src/services/mqttService.js`, `services/api/src/repositories/alertRepository.js`
- **O que fazer:**
  - Adicionar método `findActiveAlert(sensorId, level)` no `alertRepository.js`
  - Antes de criar novo alerta no `mqttService.js`, verificar se já existe alerta ativo não-resolvido para o mesmo `sensorId` + `level`
  - Auto-resolver alerta quando sensor volta ao normal
  - Adicionar testes unitários para o novo comportamento
- **Critério de aceite:** Sem alertas duplicados no MongoDB; alerta único por sensor+level enquanto ativo

---

### FASE 3 — Segurança e Produção 🟠

> **Objetivo:** Preparar stack completo para demo empresarial.

#### TASK-008 — Autenticação JWT na API (F3)

- **Status:** 🔴 Aberto
- **Prioridade:** P2
- **Arquivos:** `services/api/src/middleware/authenticate.js`, `services/api/src/routes/auth.js`
- **O que fazer:**
  - Adicionar `jsonwebtoken` como dependência
  - Criar `POST /api/v1/auth/login` com credenciais de demo (variáveis de ambiente)
  - Criar middleware `authenticate.js` que valida Bearer token
  - Proteger rotas `/api/v1/**` (exceto `/health`, `/metrics`, `/auth`)
  - Adicionar token no `client.js` do dashboard (header Authorization)
  - Adicionar testes de autenticação
- **Critério de aceite:** Requests sem token recebem 401; com token válido funcionam normalmente

---

#### TASK-009 — nginx Reverse Proxy (I3, F7)

- **Status:** 🔴 Aberto
- **Prioridade:** P2
- **Arquivo:** `infrastructure/nginx/nginx.conf`
- **O que fazer:**
  - Criar `nginx.conf` com proxy `/api/` → `api:3000`
  - Servir estático do build do dashboard
  - Headers de segurança (CSP, X-Frame-Options, etc.)
  - Rate limiting no nginx
  - Atualizar `docker-compose.prod.yml` para incluir nginx
- **Critério de aceite:** `docker compose -f docker-compose.prod.yml up -d` sobe tudo via porta 80

---

### FASE 4 — Observabilidade Avançada

> **Objetivo:** Stack de monitoramento pronto para demo.

#### TASK-010 — Grafana Dashboard (I5)

- **Status:** ✅ Completo
- **Prioridade:** P2
- **Arquivos:** `infrastructure/grafana/`
- **O que fazer:**
  - Adicionar Grafana ao `docker-compose.yml`
  - Criar `infrastructure/grafana/datasource.yml` (provisionamento Prometheus)
  - Criar `infrastructure/grafana/dashboard.json` com painéis:
    - Taxa de mensagens MQTT por tipo de sensor
    - Gauge de valores por sensor com thresholds coloridos
    - Contador de alertas por nível (warning/critical)
    - Latência HTTP p50/p95/p99
    - Métricas de processo Node.js
- **Critério de aceite:** Grafana disponível em `localhost:3001` com dados ao vivo

---

### FASE 5 — Documentação e Release

> **Objetivo:** Case empresarial completo e polido.

#### TASK-011 — OpenAPI/Swagger (D2)

- **Status:** 🔴 Aberto
- **Prioridade:** P3
- **Arquivos:** `services/api/src/app.js`, JSDoc nos routes
- **O que fazer:**
  - Adicionar `swagger-jsdoc` + `swagger-ui-express`
  - Documentar todos os endpoints com anotações JSDoc
  - Expor em `GET /api/docs`
  - Incluir exemplos de payload MQTT no README
- **Critério de aceite:** Swagger UI acessível em `http://localhost:3000/api/docs`

---

#### TASK-012 — README.md Completo (D1, D3, D4)

- **Status:** ✅ Completo
- **Prioridade:** P3
- **Arquivo:** `README.md`
- **O que fazer:**
  - Diagrama de arquitetura completo
  - Quick start com Docker Compose (< 5 minutos)
  - Como rodar os testes + ver cobertura
  - Como acessar Grafana e Prometheus
  - Descrição do caso de uso empresarial
  - Criar `CONTRIBUTING.md` com guia de PR
- **Critério de aceite:** Desenvolvedor novo consegue rodar o projeto do zero em < 5 minutos

---

#### TASK-013 — CHANGELOG e Release v1.0.0 (D5)

- **Status:** 🔴 Aberto
- **Prioridade:** P3 (último passo)
- **O que fazer:**
  - Criar `CHANGELOG.md` seguindo [Keep a Changelog](https://keepachangelog.com)
  - Consolidar todas as mudanças desde o início
  - Criar tag Git `v1.0.0` com release notes
  - Merge de `develop` → `main`
- **Critério de aceite:** Tag `v1.0.0` no repositório; `main` reflete o estado de produção

---

## 📊 Visão Geral de Priorização

```
  FASE 1 — Bugs (P0/P1)    FASE 2 — Qualidade (P1)   FASE 3+ — Features (P2/P3)
  ───────────────────────   ─────────────────────────   ──────────────────────────
  TASK-002  readings route   TASK-006  CI validate       TASK-008  Auth JWT
  TASK-003  stores duplo     TASK-007  dedup alerts      TASK-009  nginx
  TASK-004  contract tests                               TASK-010  Grafana
  TASK-005  Vue comp tests                               TASK-011  Swagger
                                                         TASK-012  README
                                                         TASK-013  Release v1.0.0
```

---

## 🏁 Definição de "Projeto Concluído" (Case Empresarial)

- [x] **TASK-002** — Rota `readings.js` usa `readingService` corretamente
- [x] **TASK-003** — Stores do dashboard sem duplo `.data`
- [x] **TASK-004** — Testes da API validam contrato `{ success, data, meta }`
- [x] **TASK-005** — Testes de componentes Vue existem e passam
- [x] **TASK-006** — CI GitHub Actions verde no push para `develop` e `main`
- [x] **TASK-007** — Deduplicação de alertas funcionando
- [x] **TASK-008** — API protegida com JWT
- [x] **TASK-009** — nginx no stack de produção
- [x] **TASK-010** — Grafana com dashboard pré-configurado
- [ ] **TASK-011** — Swagger em `/api/docs`
- [x] **TASK-012** — README.md onboarding completo
- [ ] **TASK-013** — Tag `v1.0.0` criada, `main` atualizada

---

## 📝 Histórico de Progresso

| Data | Task | Ação |
|---|---|---|
| 2026-07-22 | — | Bootstrap do projeto (Discovery Agent) |
| 2026-07-22 | TASK-001 | Evolução arquitetural fullstack (SPEC-001) — implementada parcialmente |
| 2026-07-23 | TASK-002 | ✅ Rota readings.js refatorada para usar readingService (62/62 testes) |
| 2026-07-23 | TASK-003 | ✅ Duplo .data corrigido nos stores sensors.js e alerts.js (25/25 testes) |
| 2026-07-23 | TASK-004 | ✅ Testes de contrato (B4) concluídos + Fix da CI (ReferenceError Reading) (89/89 testes) |
| 2026-07-23 | TASK-005 | ✅ Testes de componentes Vue e composables concluídos (48/48 testes passando no Dashboard) |
| 2026-07-23 | TASK-006 | ✅ CI Validado localmente (api: 89/89, simulator: 24/24, dashboard: 48/48 e build) |
| 2026-07-23 | TASK-007 | ✅ Deduplicação de alertas no repositório e auto-resolução criadas com sucesso |
| 2026-07-23 | TASK-008 | ✅ Autenticação JWT implementada e rotas da API protegidas |
| 2026-07-23 | TASK-009 | ✅ Configuração do nginx concluída e adicionada ao docker-compose de produção |
| 2026-07-23 | TASK-010 | ✅ Grafana e Prometheus configurados e rodando corretamente |
| 2026-07-23 | TASK-012 | ✅ README.md finalizado com infos de arquitetura, docs de testes e criação do CONTRIBUTING.md |
