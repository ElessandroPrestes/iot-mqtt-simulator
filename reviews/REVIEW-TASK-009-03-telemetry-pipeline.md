# Review — TASK-009-03: Pipeline compartilhado e idempotência de telemetria

Spec-Ref: SPEC-009
Task-Ref: TASK-009-03

## Target

- TASK: `TASK-009-03`
- SPEC: `SPEC-009`
- ADR: `ADR-008`
- Branch: `develop`
- Escopo: API, modelos, repositórios, migração e testes
- Data: 2026-10-23

## Status

- [ ] Approved
- [x] Approved with remarks
- [ ] Rejected

## Verificação por critério

| Critério | Resultado | Evidência |
|---|---|---|
| AC-006 | Pass no pipeline | `telemetryProcessor.test.js` processa o mesmo payload pelos adaptadores local e Azure com classificação, persistência, alerta e broadcast equivalentes |
| AC-008 | Pass | Replay com o mesmo `messageId` retorna `{ duplicate: true }` e não cria nova `Reading`, alerta ou `reading:new` |
| AC-009 | Pass | Duas mensagens concorrentes geram no máximo um alerta ativo e um `alert:new` |
| Migração | Pass | Script mantém o alerta mais recente, resolve os demais e a segunda execução não altera duplicados |
| Claim/lease | Pass | Repositório cobre claim único, lease expirado, conclusão e release para retry |
| Regressão | Pass | API 36 suítes, 219 testes; simulador 76/76; dashboard 59/59 |
| Cobertura | Pass | API 93,24% statements, 87,14% branches, 96,94% functions, 95,16% lines |

## Evidências

- `npm test` em `services/api`: 36 suítes, 219 testes.
- `npm run test:coverage` em `services/api`: thresholds globais aprovados.
- `npm test -- --runInBand tests/unit/services/mqttService.test.js tests/unit/services/telemetryPayload.test.js`: 21 testes.
- `npm test -- --runInBand tests/integration/telemetryProcessor.test.js`: 6 testes.
- `npm test -- --runInBand tests/integration/processedMessageRepository.test.js`: 6 testes.
- `npm test -- --runInBand tests/integration/alertUniquenessMigration.test.js`: 2 testes.
- Inspeção do diff sem credenciais, connection string ou certificado.

## Ressalvas

- Revisão realizada pelo mesmo agente que implementou a tarefa. Ela não
  substitui revisão independente humana exigida antes de release.
- O teste de equivalência cobre os dois adaptadores de payload e o processor
  compartilhado. O ingress Azure real só será exercitado na TASK-009-04.
- A deduplicação depende de o ingress Azure fornecer `messageId` e `source=azure`;
  a rejeição de mensagem Azure sem `messageId` fica na TASK-009-04.
- Falha ao concluir o `ProcessedMessage` é registrada, mas não libera o claim
  imediatamente; o lease expira em 60s. O modo permanece at-least-once.
- A migração deve ser executada antes de aplicar o índice único em uma base com
  duplicados ativos. Em base nova, o Mongoose cria o índice no start.
- A migração usa TLS/mTLS em produção e lê `MONGODB_URI_FILE` quando
  presente.
- Nenhum commit, push, tag, merge em `main` ou release foi executado.

## Decisão

Aprovado com ressalvas para o escopo da TASK-009-03. O pipeline local preserva
o comportamento anterior e a idempotência Azure está pronta para ser conectada
ao ingress da TASK-009-04.
