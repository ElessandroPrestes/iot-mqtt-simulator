# Review — TASK-015: Determinismo do CI/CD

**Data:** 2026-07-27

**SPEC:** `SPEC-007`

**ADR:** `ADR-007`

## Status

🟡 **Approved for push — gate remoto pendente**

## Diagnóstico confirmado

- A consulta e criação de sessão eram operações separadas, permitindo
  ultrapassagem concorrente do limite.
- A PR Dependabot de Vite 8 atualizava apenas `vite`, deixando plugin Vue 5 e
  Vitest 1 com peers incompatíveis.
- O CI oficial da `main` no commit-base estava verde; a falha de dependência
  pertencia ao commit candidato do Dependabot.

## Implementação revisada

- Lock MongoDB por principal com UUID de ownership, lease de 30 segundos,
  espera máxima de 10 segundos e liberação em `finally`.
- Recuperação comprovada após falha de persistência e lease expirado.
- Teste com oito logins paralelos: um `200`, sete `409 SESSION_LIMIT`.
- Toolchain fixado em Vite 8.1.5, plugin Vue 6.0.8 e família Vitest 4.1.10.
- Dependabot agrupa o toolchain em uma única atualização.
- Nenhum bypass de peer dependency ou redução de gate foi adicionado.

## Evidências locais

- Cenário concorrente repetido cinco vezes sem flutuação.
- API: 32 suítes, 194 testes, 94,64% de linhas e 85,66% de branches.
- Dashboard: `npm ci`, 59 testes e build aprovados.
- Simulator: 28 testes aprovados.
- Imagens `api:production` e `dashboard:production` construídas.
- `npm audit --omit=dev --audit-level=high` sem vulnerabilidade bloqueante.
- `dependabot.yml` parseado com sucesso.

## Decisão

A alteração está aprovada para commit e push na `main`. O review só será
marcado final após o workflow remoto concluir com sucesso. Nenhum deploy da
aplicação foi autorizado ou realizado.
