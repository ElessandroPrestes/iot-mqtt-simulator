# Review — TASK-009-04: Ingress Azure Event Hubs e health por transporte

Spec-Ref: SPEC-009
Task-Ref: TASK-009-04

## Target

- TASK: `TASK-009-04`
- SPEC: `SPEC-009`
- ADR: `ADR-008`
- Branch: `develop`
- Escopo: API, ingress, health, métricas, redaction e testes
- Data: 2026-10-23

## Status

- [ ] Approved
- [x] Approved with remarks
- [ ] Rejected

## Verificação por critério

| Critério | Resultado | Evidência |
|---|---|---|
| AC-007 | Pass com mock | `AzureEventHubsIngress` consome lotes pelo `EventHubConsumerClient`, processa via `TelemetryProcessor` com `source=azure` e não inicializa MQTT no modo Azure |
| AC-010 | Pass | `/health` preserva os campos anteriores e adiciona `transport`, `services.mqtt` e `services.azureEventHubs`; Azure conectado fica `healthy` com MQTT `disabled` |
| Encerramento | Pass | `stop()` fecha subscription e client uma vez, limpa referências e publica status `disconnected` |
| Falha de conexão | Pass | Falha de construtor/subscribe fecha o client quando existente, registra métrica e status `error` |
| Mensagem inválida | Pass | Sem `messageId`, corpo vazio, JSON inválido ou falha do processor são rejeitados sem interromper o lote |
| Deduplicação | Pass | Resultado `{ duplicate: true }` não gera broadcast e é contabilizado como `duplicate` |
| Seleção de transporte | Pass | `createIngress` e bootstrap iniciam somente o ingress configurado |
| Redaction | Pass | API redige `SharedAccessKey`, `SharedAccessSignature`, `AccountKey`, `sig` e `sas` |
| Regressão | Pass | API 41 suítes/255 testes; simulador 76/76; dashboard 59/59 |
| Cobertura | Pass | API 93,32% statements, 85,95% branches, 95,56% functions, 95,07% lines |

## Evidências

- `npm test` em `services/api`: 41 suítes, 255 testes.
- `npm run test:coverage` em `services/api`: thresholds globais aprovados.
- `npm test -- --runInBand tests/unit/ingress/azureEventHubsIngress.test.js`: 16 testes.
- `npm test -- --runInBand tests/unit/index.test.js`: 5 testes de seleção e shutdown.
- `npm test -- --runInBand tests/integration/routes/health.test.js`: 7 testes de health.
- `npm test` em `services/simulator`: 76 testes.
- `npm test -- --run` em `services/dashboard`: 59 testes.
- Inspeção do diff sem connection string, SAS ou certificado.

## Ressalvas

- Revisão realizada pelo mesmo agente que implementou a tarefa. Ela não
  substitui revisão independente humana exigida antes de release.
- O teste real no Azure não foi executado; a cobertura usa
  `EventHubConsumerClient` mockado. O aceite real permanece opt-in.
- Não há checkpoint store; a entrega é at-least-once e a deduplicação depende do
  `messageId` publicado pelo simulador.
- `processClose` é tratado como fechamento da subscription e publica
  `disconnected`. Eventos tardios após `stop()` dependem do encerramento do SDK.
- O status do ingress é mantido em memória no processo da API; não há
  compartilhamento entre réplicas.
- O modo Azure de produção continua exigindo a configuração de TLS/mTLS de
  workload já existente para MongoDB e API.
- Docker de produção, variáveis Azure no compose, rollback e teste manual da
  stack permanecem na TASK-009-05.
- Nenhum commit, push, tag, merge em `main` ou release foi executado.

## Decisão

Aprovado com ressalvas para o escopo da TASK-009-04. O modo local permanece o
padrão e o ingress Azure está pronto para a validação de integração, Docker e
rollback da TASK-009-05.
