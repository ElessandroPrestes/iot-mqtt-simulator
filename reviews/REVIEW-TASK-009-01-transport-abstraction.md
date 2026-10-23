# Review — TASK-009-01: Abstração de transporte e publisher local

Spec-Ref: SPEC-009
Task-Ref: TASK-009-01

## Target

- TASK: `TASK-009-01`
- SPEC: `SPEC-009`
- ADR: `ADR-008`
- Branch: `develop`
- Escopo: simulador, configuração e testes
- Data: 2026-10-23

## Status

- [ ] Approved
- [x] Approved with remarks
- [ ] Rejected

## Verificação por critério

| Critério | Resultado | Evidência |
|---|---|---|
| AC-001 | Pass (automação) | Testes do simulador, API e dashboard verdes; stack Docker manual não executada nesta tarefa |
| AC-002 | Pass | `sensorFactory.test.js` confirma 8 sensores totais e distribuição determinística |
| AC-003 | Pass no escopo local | `createPublisher.test.js` confirma publisher local e falha explícita para Azure; branch Azure pertence à TASK-009-02 |
| AC-005 | Pass | `simulator.test.js` confirma intervalo único, `stop()` idempotente e falhas de publicação isoladas |
| Regressão | Pass | Simulador 50/50, API 194/194 e dashboard 59/59 |
| Cobertura | Pass | 97,65% statements, 90,22% branches, 91,66% functions, 98,51% lines |

## Evidências

- `npm test` em `services/simulator`: 7 suítes, 50 testes.
- `npm run test:coverage` em `services/simulator`: thresholds globais aprovados.
- `npm test` em `services/api`: 32 suítes, 194 testes.
- `npm test` em `services/dashboard`: 12 arquivos, 59 testes.
- `python3 scripts/generate_traceability.py` executado com sucesso.
- `git diff --check` sem erros.
- Inspeção de logs e diff sem connection string, chave SAS ou certificado.

## Ressalvas

- Revisão realizada pelo mesmo agente que implementou a tarefa. Ela não
  substitui revisão independente humana exigida antes de release.
- O teste manual da stack Docker com Mosquitto real não foi executado; a
  validação foi automatizada com cliente MQTT falso e regressão dos serviços.
- `TELEMETRY_TRANSPORT=azure` falha de propósito até a TASK-009-02.
- O timeout de encerramento do publisher local não é cancelado explicitamente
  após o callback; ele é `unref()` e não mantém o processo vivo.
- Este review não autoriza commit, push, tag, merge em `main`, release ou deploy.

## Decisão

Aprovado com ressalvas para o escopo da TASK-009-01. O modo local permanece o
padrão e a implementação Azure continua nas tarefas seguintes.
