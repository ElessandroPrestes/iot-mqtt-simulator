# TAREFA (TASK): Atualização de dependências e imagens base

## Metadados

| Campo | Valor |
|---|---|
| ID | TASK-011-01 |
| Status | Done (Concluído) |
| Responsável | Engenharia e Segurança |
| Refs: | SPEC: SPEC-011; Critérios de aceitação: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006; ADRs: ADR-005, ADR-006 |
| Dependências | Nenhuma |

## Objetivo

Restaurar os gates de segurança do CI corrigindo dependências de produção e
pacotes de imagem com versões compatíveis, sem alterar comportamento.

## Escopo

### Incluído

- `services/api/package-lock.json` — `npm audit fix`.
- `services/dashboard/package-lock.json` — `npm audit fix`.
- `services/api/Dockerfile`, `services/simulator/Dockerfile` e
  `services/dashboard/Dockerfile` — digests e `apk upgrade`.
- `CHANGELOG.md` — manutenção de segurança.
- `reviews/REVIEW-TASK-011-01-security-dependency-refresh.md`.
- `docs/traceability-matrix.md` — regeneração.

### Excluído

- `npm audit fix --force` e upgrades breaking.
- Código de produto, contratos, schema e interface.
- Release, tag, merge em `main` ou deploy.

## Abordagem e impacto

- Prováveis arquivos: lockfiles, Dockerfiles, changelog, review e matriz.
- Dados, contratos ou migrações: nenhum.
- Riscos e salvaguardas: validar testes e build; não mascarar achados.
- ADRs e padrões aplicáveis: ADR-005, ADR-006, `standards/security.md`.

## Etapas (Steps)

- [x] Atualizar lockfiles com `npm audit fix`.
- [x] Atualizar digests das imagens base.
- [x] Aplicar `apk upgrade --no-cache` nos estágios de produção.
- [x] Validar audits, testes e build.
- [x] Atualizar changelog, review e matriz.
- [x] Confirmar CI verde após push.

## Validação

| Critério/risco | Teste, comando, ou revisão | Evidência esperada |
|---|---|---|
| AC-001 | `npm audit --omit=dev --audit-level=high` na API | Código 0 |
| AC-002 | `npm audit --omit=dev --audit-level=high` no Dashboard | Código 0 |
| AC-003 | `npm test` na API | Suíte verde |
| AC-004 | `npm test` e `npm run build` no Dashboard | Ambos verdes |
| AC-005 | Run de CI com Trivy nas três imagens | Sem bloqueios |
| AC-006 | `git diff --stat` | Somente lockfiles, Dockerfiles e documentação |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações locais aprovados.
- [x] CI verde confirmado no run `40978199031`.
- [x] Documentação e rastreabilidade atualizadas.

## Resultado

- Mudanças feitas: lockfiles, Dockerfiles, `CHANGELOG.md`, review e matriz.
- Evidência: comandos locais e run de CI registrados no review.
- Trabalho em aberto: revisão independente humana antes de release.
