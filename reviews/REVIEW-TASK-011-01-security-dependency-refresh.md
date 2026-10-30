# Review — TASK-011-01: Atualização de dependências e imagens base

Spec-Ref: SPEC-011
Task-Ref: TASK-011-01

## Target

- TASK: `TASK-011-01`
- SPEC: `SPEC-011`
- Branch: `develop`
- Escopo: lockfiles de produção, imagens base e documentação
- Data: 2026-10-29

## Status

- [ ] Approved
- [x] Approved with remarks
- [ ] Rejected

## Verificação por critério

| Critério | Resultado | Evidência |
|---|---|---|
| AC-001 | Pass | `npm audit --omit=dev --audit-level=high` na API: exit `0` |
| AC-002 | Pass | `npm audit --omit=dev --audit-level=high` no Dashboard: exit `0` |
| AC-003 | Pass | API: 41 suítes, 255 testes aprovados |
| AC-004 | Pass | Dashboard: 12 arquivos, 59 testes e `vite build` aprovados |
| AC-005 | Pass | Run `40978199031`: jobs `Imagem — api`, `Imagem — simulator` e `Imagem — dashboard` aprovados |
| AC-006 | Pass | Diff restrito a lockfiles, Dockerfiles, SPEC/TASK, changelog, review e matriz |

## Evidências

- `npm audit fix` na API e no Dashboard, sem `--force`.
- Versões corrigidas na API: `body-parser` 1.20.9, `proxy-addr` 2.0.8,
  `compression` 1.8.2, `engine.io` 6.6.11, `fast-uri` 3.1.9,
  `ip-address` 10.7.5, `joi` 17.13.9, `js-yaml` 4.3.2,
  `brace-expansion` 5.0.12.
- Digests atualizados: `node:22-alpine@sha256:fe4f6d74...` e
  `nginx:alpine@sha256:785835ea...`.
- `RUN apk upgrade --no-cache` aplicado nos estágios escaneados.
- Builds locais dos targets `api:production`, `simulator:base` e
  `dashboard:production`: concluídos.
- Trivy local não executado: a imagem `aquasec/trivy:0.70.0` não pôde ser
  obtida no ambiente; a validação canônica foi o run de CI `40978199031`.

## Ressalvas

- Revisão realizada pelo mesmo agente que implementou a correção. Ela não
  substitui revisão independente humana exigida antes de release.
- Nenhum upgrade breaking (`npm audit fix --force`) foi aplicado.
- Este review não autoriza tag, merge em `main`, release público ou deploy.

## Decisão

Aprovado com ressalvas para o escopo local. Audits, testes, build e os gates de
imagem do run `40978199031` passaram; a TASK foi concluída.
