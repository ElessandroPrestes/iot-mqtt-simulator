# Matriz de rastreabilidade (Traceability matrix)

Gerado por `scripts/generate_traceability.py`. Não edite manualmente; execute novamente o gerador após artefatos de origem ou alterações no histórico do Git.

| SPEC | Status | Tarefas (Tasks) | Commits | QA/revisão |
|---|---|---|---|---|
| [SPEC-001](../specs/SPEC-001-fullstack-architecture-evolution.md) | Aprovada e concluída | [TASK-001](../tasks/TASK-001-fullstack-architecture-evolution.md) (Concluída)<br>[TASK-002](../tasks/TASK-002-fix-readings-route-service.md) (Concluído)<br>[TASK-003](../tasks/TASK-003-fix-dashboard-stores-double-data.md) (Concluído) | `
6c2d7db` fix(api,dashboard): corrigir bugs B1-B3 de TASK-002 e TASK-003<br>`
13b2e13` docs(sdlc): adicionar plano de implementação e tasks TASK-002~013 | — |
| [SPEC-002](../specs/SPEC-002-alert-deduplication.md) | Aprovada e concluída | [TASK-007](../tasks/TASK-007-alert-deduplication.md) (Concluído) | `
b4194b2` docs: adicionar SPECs 002 a 005 para aderência ao fluxo SDD<br>`
13b2e13` docs(sdlc): adicionar plano de implementação e tasks TASK-002~013 | — |
| [SPEC-003](../specs/SPEC-003-api-security-jwt.md) | Aprovada e concluída; controles ampliados pela SPEC-006 | [TASK-008](../tasks/TASK-008-jwt-authentication.md) (Concluído — ampliado pela SPEC-006) | `
b4194b2` docs: adicionar SPECs 002 a 005 para aderência ao fluxo SDD<br>`
13b2e13` docs(sdlc): adicionar plano de implementação e tasks TASK-002~013 | — |
| [SPEC-004](../specs/SPEC-004-production-observability.md) | Aprovada e concluída; topologia endurecida pela SPEC-006 | [TASK-009](../tasks/TASK-009-nginx-reverse-proxy.md) (Concluído — endurecido pela SPEC-006)<br>[TASK-010](../tasks/TASK-010-grafana-dashboard.md) (Concluído — endurecido pela SPEC-006) | `
f2ef7f9` feat: configure nginx reverse proxy and fix docker compose<br>`
b4194b2` docs: adicionar SPECs 002 a 005 para aderência ao fluxo SDD<br>`
13b2e13` docs(sdlc): adicionar plano de implementação e tasks TASK-002~013 | — |
| [SPEC-005](../specs/SPEC-005-api-documentation.md) | Aprovada e concluída para execução exclusivamente local | [TASK-011](../tasks/TASK-011-openapi-swagger.md) (Concluído — aprovado e validado localmente em 2026-07-27) | `
b4194b2` docs: adicionar SPECs 002 a 005 para aderência ao fluxo SDD<br>`
13b2e13` docs(sdlc): adicionar plano de implementação e tasks TASK-002~013 | [REVIEW-PROJECT-LOCAL-SDD.md](../reviews/REVIEW-PROJECT-LOCAL-SDD.md) (Approved) |
| [SPEC-006](../specs/SPEC-006-owasp-security-hardening.md) | Aprovada e emendada para execução local com Level 2 | [TASK-014](../tasks/TASK-014-owasp-security-hardening.md) (Concluída — aprovada para execução exclusivamente local) | — | [REVIEW-TASK-014-owasp-security-hardening.md](../reviews/REVIEW-TASK-014-owasp-security-hardening.md) (Approved) |
| [SPEC-007](../specs/SPEC-007-ci-determinism.md) | Concluída e aprovada na `main` | [TASK-015](../tasks/TASK-015-fix-ci-determinism.md) (Concluída) | — | [REVIEW-TASK-015-fix-ci-determinism.md](../reviews/REVIEW-TASK-015-fix-ci-determinism.md) (Aprovado) |
| [SPEC-008](../specs/SPEC-008-risk-limitations-corrections.md) | Approved (Aprovado) | [TASK-008-01](../tasks/TASK-008-01-risk-limitations-corrections.md) (Done (Concluído)) | `034f32d2` docs(traceability): registra entrega da TASK-008-01<br>`
1a93695` docs(sdd): corrige riscos, limitações e rastreabilidade | [REVIEW-TASK-008-01-risk-limitations.md](../reviews/REVIEW-TASK-008-01-risk-limitations.md) (Approved with remarks) |
| [SPEC-009](../specs/SPEC-009-azure-iot-hub-integration.md) | Approved (Aprovado) | [TASK-009-01](../tasks/TASK-009-01-transport-abstraction-publisher.md) (Done (Concluído))<br>[TASK-009-02](../tasks/TASK-009-02-azure-iot-hub-publisher.md) (Done (Concluído))<br>[TASK-009-03](../tasks/TASK-009-03-telemetry-pipeline-idempotency.md) (Done (Concluído))<br>[TASK-009-04](../tasks/TASK-009-04-azure-event-hubs-ingress.md) (Done (Concluído))<br>[TASK-009-05](../tasks/TASK-009-05-tests-docker-docs-rollback.md) (In Progress (Em andamento)) | — | [REVIEW-TASK-009-01-transport-abstraction.md](../reviews/REVIEW-TASK-009-01-transport-abstraction.md) (Approved with remarks)<br>[REVIEW-TASK-009-02-azure-publisher.md](../reviews/REVIEW-TASK-009-02-azure-publisher.md) (Approved with remarks)<br>[REVIEW-TASK-009-03-telemetry-pipeline.md](../reviews/REVIEW-TASK-009-03-telemetry-pipeline.md) (Approved with remarks)<br>[REVIEW-TASK-009-04-azure-event-hubs-ingress.md](../reviews/REVIEW-TASK-009-04-azure-event-hubs-ingress.md) (Approved with remarks) |

## Lacunas de rastreabilidade (Traceability gaps)

- `TASK-001` não possui commit com `Task-Ref: TASK-001`.
- `TASK-004` não possui referência de SPEC.
- `TASK-005` não possui referência de SPEC.
- `TASK-006` não possui referência de SPEC.
- `TASK-009-01` não possui commit com `Task-Ref: TASK-009-01`.
- `TASK-009-02` não possui commit com `Task-Ref: TASK-009-02`.
- `TASK-009-03` não possui commit com `Task-Ref: TASK-009-03`.
- `TASK-009-04` não possui commit com `Task-Ref: TASK-009-04`.
- `TASK-009-05` não possui commit com `Task-Ref: TASK-009-05`.
- `TASK-012` não possui referência de SPEC.
- `TASK-013` não possui referência de SPEC.
- `TASK-014` não possui commit com `Task-Ref: TASK-014`.
- `TASK-015` não possui commit com `Task-Ref: TASK-015`.
