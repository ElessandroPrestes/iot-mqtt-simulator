# TAREFA (TASK): Bootstrap de segredos do compose de desenvolvimento

## Metadados

| Campo | Valor |
|---|---|
| ID | TASK-010-01 |
| Status | Done (Concluído) |
| Responsável | Engenharia e Documentação |
| Refs: | SPEC: SPEC-010; Critérios de aceitação: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006; ADRs: ADR-006 |
| Dependências | Nenhuma |

## Objetivo

Restaurar o caminho de desenvolvimento (`make build` / `make up`) gerando os
segredos obrigatórios de forma aleatória e idempotente, sem reintroduzir
defaults conhecidos.

## Escopo

### Incluído

- `scripts/local/dev-env.sh` — bootstrap idempotente de `.env`.
- `Makefile` — alvo `dev-env` e dependência em `build` e `up`.
- `.env.example` — documentação de `JWT_SECRET` e `GF_SECURITY_ADMIN_PASSWORD`.
- `README.md` — fluxo de desenvolvimento e troubleshooting.
- `PROJECT.md` — comandos e variáveis críticas.
- `CHANGELOG.md` — entrada em `[Unreleased]`.
- `reviews/REVIEW-TASK-010-01-dev-compose-secrets.md` — evidência de revisão.
- `docs/traceability-matrix.md` — regeneração.

### Excluído

- Código de produto, testes de runtime, compose de produção, lifecycle local
  seguro e CI.
- Tag, release, merge em `main` ou deploy.

## Abordagem e impacto

- Prováveis arquivos ou componentes: os listados no escopo.
- Dados, contratos ou migrações: nenhum.
- Riscos e salvaguardas: preservar `:?` no compose; nunca sobrescrever valor
  não vazio; manter `.env` fora do Git.
- ADRs e padrões aplicáveis: ADR-006, `standards/security.md`,
  `standards/commits.md`.

## Etapas (Steps)

- [x] Criar `scripts/local/dev-env.sh`.
- [x] Integrar `dev-env` ao `Makefile` e às metas `build` e `up`.
- [x] Atualizar `.env.example`, `README.md`, `PROJECT.md` e `CHANGELOG.md`.
- [x] Executar o bootstrap no ambiente local.
- [x] Validar interpolação, idempotência e fail-closed.
- [x] Registrar revisão e regenerar a matriz.

## Validação

| Critério/risco | Teste, comando, ou revisão | Evidência esperada |
|---|---|---|
| AC-001 | `make dev-env` com variáveis ausentes | `JWT_SECRET` e `GF_SECURITY_ADMIN_PASSWORD` preenchidos |
| AC-002 | Executar `make dev-env` duas vezes | Valores preservados |
| AC-003 | `docker compose config -q` após bootstrap | Saída sem erro |
| AC-004 | `docker compose config -q` sem o segredo | Erro citando `GF_SECURITY_ADMIN_PASSWORD` |
| AC-005 | Inspeção de `.env.example`, `README.md` e `PROJECT.md` | Documentação presente |
| AC-006 | `git status` e `git check-ignore .env` | `.env` ignorado; sem segredo rastreado |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis foram aprovados.
- [x] A documentação e rastreabilidade estão atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças feitas: `scripts/local/dev-env.sh`, `Makefile`, `.env.example`,
  `README.md`, `PROJECT.md`, `CHANGELOG.md`, `reviews/` e matriz.
- Evidência: comandos de validação registrados em
  `reviews/REVIEW-TASK-010-01-dev-compose-secrets.md`.
- Trabalho em aberto ou bloqueios: revisão independente humana antes de release;
  o fluxo recomendado continua sendo `make local-secure-up`.
