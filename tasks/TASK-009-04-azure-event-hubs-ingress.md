# TAREFA (TASK): Ingress Azure Event Hubs e health por transporte

## Metadados

| Campo | Valor |
|---|---|
| ID | TASK-009-04 |
| Status | Done (Concluído) |
| Responsável | Engenharia |
| Refs: | SPEC: SPEC-009; Critérios de aceitação: AC-007, AC-010; ADRs: ADR-008 |
| Dependências | TASK-009-02, TASK-009-03 |

## Objetivo

Consumir o endpoint interno do IoT Hub com `@azure/event-hubs`, integrar o
ingress ao pipeline compartilhado e tornar health e métricas cientes do
transporte ativo.

## Escopo

### Incluído

- Dependência `@azure/event-hubs` na API.
- `AzureEventHubsIngress` com `EventHubConsumerClient`, `startPosition:
  earliest`, lote limitado e sem checkpoint store.
- Seleção de ingress no bootstrap da API conforme `TELEMETRY_TRANSPORT`.
- Encerramento controlado do ingress.
- Health aditivo com `transport` e `services.azureEventHubs`.
- Métricas de recebimento, processamento, rejeição, duplicidade, latência,
  reconexão e falha por transporte.
- Testes com cliente Event Hubs mockado e testes de health local/Azure.

### Excluído

- Publisher Azure no simulador.
- Checkpoint com Blob Storage.
- Provisionamento de IoT Hub, Event Hubs ou Storage.
- Teste real no Azure sem autorização.
- Alteração de rotas REST existentes além do health aditivo.
- Commit, push ou release.

## Abordagem e impacto

- **Arquivos prováveis:** `services/api/src/index.js`, novo
  `services/api/src/ingress/azureEventHubsIngress.js`, novo
  `services/api/src/ingress/localMqttIngress.js`,
  `services/api/src/config/azure.js`,
  `services/api/src/config/runtime.js`, `services/api/src/routes/health.js`,
  `services/api/src/services/metricsService.js`, testes e
  `services/api/package.json`/lockfile.
- **Dados, contratos ou migrações:** health ganha campos aditivos; nenhuma
  migração de dados nesta tarefa.
- **Riscos e salvaguardas:** não abrir MQTT no modo Azure; não iniciar Azure no
  modo local; falha de conexão deve ser observável; encerramento não pode
  deixar subscription aberta; logs não podem conter connection string.
- **ADRs e padrões aplicáveis:** ADR-008, `standards/quality-gates.md`,
  `standards/observability.md`.

## Etapas (Steps)

- [x] Adicionar `@azure/event-hubs` e atualizar o lockfile.
- [x] Criar `AzureEventHubsIngress` com subscription e close.
- [x] Encapsular o MQTT atual em `LocalMqttIngress`.
- [x] Selecionar o ingress no bootstrap e ajustar o shutdown.
- [x] Adicionar health aditivo e status do ingress ativo.
- [x] Adicionar métricas por transporte.
- [x] Adicionar testes com mocks e health local/Azure.

## Validação

| Critério/risco | Teste, comando, ou revisão | Evidência esperada |
|---|---|---|
| AC-007 | Teste do ingress com `EventHubConsumerClient` mockado | Evento consumido via Event Hubs; MQTT não inicializado |
| AC-010 | Testes de health local e Azure | Campos atuais preservados; MQTT disabled não gera degraded |
| Encerramento | Teste de `stop()` do ingress | Subscription fechada e sem timers pendentes |
| Regressão | `npm test` na API | Testes existentes passam |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis foram aprovados.
- [x] A documentação e rastreabilidade estão atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças feitas:
  - `@azure/event-hubs@6.0.4` fixado na API.
  - `AzureEventHubsIngress` com `EventHubConsumerClient`, `startPosition`
    earliest, lote de 50 e `maxWaitTimeInSeconds` 5, sem checkpoint store.
  - `LocalMqttIngress`, `createIngress` e `status` para seleção explícita do
    transporte.
  - Bootstrap integrado com start/stop do ingress e shutdown controlado.
  - Health aditivo com `transport`, `services.mqtt` e
    `services.azureEventHubs`.
  - Métricas de aceite, processamento, duplicidade, rejeição, latência,
    reconexão e falha por transporte.
  - Redaction da API ampliada para `SharedAccessKey`, `SharedAccessSignature`,
    `AccountKey`, `sig` e `sas`.
- Evidência:
  - API: 41 suítes, 255 testes passando; cobertura 93,32% statements, 85,95%
    branches, 95,56% functions e 95,07% lines.
  - Simulador: 10 suítes, 76 testes passando.
  - Dashboard: 12 arquivos, 59 testes passando.
  - Testes novos: `azure.test.js` (6), `azureEventHubsIngress.test.js` (16),
    `localMqttIngress.test.js` (3), `createIngress.test.js` (3), `index.test.js`
    (5) e health (7, incluindo dois modos).
- Trabalho em aberto ou bloqueios (blockers):
  - Teste real no Azure permanece opt-in e depende de autorização/credenciais.
  - Checkpoint com Blob Storage permanece fora do escopo.
  - Docker de produção e rollback serão tratados na TASK-009-05.
  - Nenhum commit, push, tag ou release foi executado.
