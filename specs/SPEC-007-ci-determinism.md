# SPEC-007 — Correção determinística do CI/CD

## Status

🟢 **Concluída e aprovada na `main`**

**Aprovação humana:** 2026-07-27

## 1. Objetivo

Eliminar as falhas intermitentes e de resolução de dependências observadas no
CI da `main`, sem reduzir gates de teste, segurança ou integridade.

## 2. Escopo

- Admissão concorrente de sessões na API.
- Modelo de coordenação `AuthenticationState`.
- Testes de concorrência e liberação do lock.
- Toolchain de build/teste do Dashboard e seu lockfile.
- Agrupamento de dependências relacionadas no Dependabot.
- Validação dos jobs API, Dashboard, Simulator e imagens.

## 3. Requisitos

### 3.1. Limite concorrente de sessões

- A decisão de admitir uma nova família deve ser serializada por principal.
- Com limite igual a 1, oito logins simultâneos devem produzir exatamente um
  `200` e sete `409 SESSION_LIMIT`.
- O lock deve possuir lease, identidade de proprietário e liberação em
  `finally`.
- Erro ao persistir a sessão não pode deixar lock permanente.
- A solução deve funcionar com MongoDB standalone.

### 3.2. Toolchain do Dashboard

- `vite`, `@vitejs/plugin-vue` e a família Vitest devem declarar versões
  mutuamente compatíveis.
- `npm ci`, `npm test` e `npm run build` devem passar sem `--force` ou
  `--legacy-peer-deps`.
- O target Docker `production` do Dashboard deve construir a partir do mesmo
  lockfile.
- Dependabot deve agrupar futuras atualizações do toolchain.

### 3.3. CI/CD

- Nenhum threshold de cobertura pode ser reduzido.
- Nenhum job ou scan pode ser desabilitado.
- O gate consolidado deve continuar dependendo de todos os jobs.
- O push autorizado destina-se à `main` e não constitui deploy da aplicação.

## 4. Critérios de aceite

- [x] Teste concorrente ampliado passa de forma determinística.
- [x] Suíte API e thresholds de cobertura passam.
- [x] `npm ci`, testes e build do Dashboard passam.
- [x] Testes do Simulator passam.
- [x] Imagem do Dashboard constrói com `npm ci`.
- [x] Configuração Dependabot agrupa o toolchain.
- [x] CI remoto do commit na `main` termina verde.

## 5. Referências

- [ADR-005 — Pipeline CI](../adr/ADR-005-cicd.md)
- [ADR-007 — Determinismo do CI e admissão](../adr/ADR-007-ci-determinism-session-admission.md)
- [SPEC-006 — Hardening OWASP](SPEC-006-owasp-security-hardening.md)
- [TASK-015 — Correção CI/CD](../tasks/TASK-015-fix-ci-determinism.md)

## 6. Aprovação

- [x] Diagnóstico aprovado.
- [x] Arquitetura corretiva aprovada.
- [x] Implementação, commit e push para `main` autorizados.
- [x] Deploy da aplicação permanece fora do escopo.
