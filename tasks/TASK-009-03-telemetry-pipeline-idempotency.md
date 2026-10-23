# TAREFA (TASK): Pipeline compartilhado e idempotência de telemetria

## Metadados

| Campo | Valor |
|---|---|
| ID | TASK-009-03 |
| Status | Done (Concluído) |
| Responsável | Engenharia |
| Refs: | SPEC: SPEC-009; Critérios de aceitação: AC-006, AC-008, AC-009; ADRs: ADR-008 |
| Dependências | TASK-009-01 |

## Objetivo

Extrair o processamento de telemetria do MQTT para um pipeline reutilizável,
adicionar deduplicação durável para mensagens Azure e garantir unicidade de
alertas ativos sob concorrência.

## Escopo

### Incluído

- `telemetryPayload` para validação/normalização independente de tópico.
- `telemetryProcessor` para classificação, persistência, alertas, broadcast e
  métricas.
- Adaptação do `mqttService` para usar o pipeline compartilhado, preservando o
  comportamento local.
- `ProcessedMessage` com `_id` determinístico, claim/lease e TTL de 7 dias.
- Repositório de `ProcessedMessage`.
- Índice único parcial de alertas ativos e migração idempotente de duplicados.
- Testes de equivalência entre ingress, replay, concorrência e migração.

### Excluído

- Ingress Azure e SDK `@azure/event-hubs`.
- Publisher Azure.
- Alteração do schema timeseries de `Reading`.
- Deduplicação no modo local.
- Commit, push ou release.

## Abordagem e impacto

- **Arquivos prováveis:** `services/api/src/services/mqttService.js`, novos
  `services/api/src/services/telemetryPayload.js` e
  `telemetryProcessor.js`, novo
  `services/api/src/models/ProcessedMessage.js`, novo
  `services/api/src/repositories/processedMessageRepository.js`,
  `services/api/src/models/Alert.js`,
  `services/api/src/repositories/alertRepository.js`, script de migração,
  testes e `package.json`/lockfile se necessário.
- **Dados, contratos ou migrações:** nova coleção aditiva; índice parcial em
  `Alert`; migração de duplicados ativos. Nenhuma alteração em `Reading`.
- **Riscos e salvaguardas:** claim não pode perder mensagem silenciosamente;
  falha capturada deve liberar o claim; índice único exige limpeza prévia;
  mensagem sem `messageId` deve ser rejeitada.
- **ADRs e padrões aplicáveis:** ADR-008, `standards/quality-gates.md`,
  `standards/testing.md`.

## Etapas (Steps)

- [x] Extrair `telemetryPayload` e manter os testes atuais verdes.
- [x] Extrair `telemetryProcessor` e fazer o `mqttService` usá-lo.
- [x] Criar `ProcessedMessage` e o repositório com claim/lease e TTL.
- [x] Integrar a idempotência no processor para chaves fornecidas.
- [x] Adicionar índice único parcial em `Alert`.
- [x] Criar script idempotente de migração de alertas ativos duplicados.
- [x] Adicionar testes de equivalência, replay, concorrência e migração.

## Validação

| Critério/risco | Teste, comando, ou revisão | Evidência esperada |
|---|---|---|
| AC-006 | Testes unitários dos dois ingress com o mesmo payload | Mesmo resultado de classificação, persistência e broadcast |
| AC-008 | Teste de replay com o mesmo `messageId` | Uma leitura, um alerta e um broadcast |
| AC-009 | Teste concorrente de criação de alerta | No máximo um alerta ativo e um `alert:new` |
| Migração | Execução do script duas vezes | Segunda execução não altera duplicados já resolvidos |
| Regressão | `npm test` na API | Testes existentes passam |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis foram aprovados.
- [x] A documentação e rastreabilidade estão atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças feitas: `telemetryPayload` independente de tópico; `TelemetryProcessor` compartilhado; `mqttService` adaptado; `ProcessedMessage` com claim/lease/TTL; repositório; índice único parcial em `Alert`; migração idempotente; testes de equivalência, replay, concorrência e migração.
- Evidência: `npm test` na API com 36 suítes e 219 testes; cobertura global em 93,24% statements, 87,14% branches, 96,94% functions e 95,16% lines; 11 testes de payload, 6 de processor, 6 de repositório e 2 de migração.
- Trabalho em aberto ou bloqueios (blockers): ingress Azure e deduplicação obrigatória de `messageId` ficam na TASK-009-04; nenhum commit, push ou release executado.
