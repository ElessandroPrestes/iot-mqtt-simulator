# ADR-007 — Determinismo do CI e admissão concorrente de sessões

**Data:** 2026-07-27

**Status:** Aceito

## Contexto

O CI da `main` revelou dois comportamentos não determinísticos:

1. `createSession` consultava famílias ativas e criava a sessão em operações
   separadas. Logins paralelos podiam observar a mesma contagem e ambos serem
   aceitos acima de `maxConcurrentSessions`.
2. O Dependabot atualizou `vite` isoladamente para a versão 8, mantendo
   `@vitejs/plugin-vue` 5 e Vitest 1. O `npm ci` rejeitou corretamente o grafo
   por incompatibilidade de peer dependencies.

Retry de teste, `--legacy-peer-deps`, `--force` e relaxamento do critério de
sessão apenas esconderiam defeitos de concorrência ou de supply chain.

## Decisão

### Admissão de sessão

- Serializar a seção crítica `contar famílias → criar sessão` por principal.
- Usar `AuthenticationState` como coordenador MongoDB, com lock identificado
  por UUID e lease limitado.
- Somente o proprietário pode liberar o lock.
- Expiração do lease permite recuperação após interrupção do processo.
- Falha em adquirir o lock dentro do limite deve falhar fechado, sem criar
  sessão.
- A liberação ocorre em `finally`.

O lock no banco funciona entre requisições e instâncias da API, sem depender de
mutex exclusivo do processo Node.js ou de transações MongoDB indisponíveis em
topologia standalone.

### Toolchain do Dashboard

- Tratar `vite`, `@vitejs/plugin-vue`, `vitest`, `@vitest/ui` e
  `@vitest/coverage-v8` como um conjunto de compatibilidade.
- Fixar versões exatas no manifesto e lockfile.
- Manter `npm ci` sem flags de bypass.
- Agrupar futuras atualizações desse conjunto no Dependabot.
- Manter Node.js 22 no CI, respeitando o requisito mínimo do Vite selecionado.

## Consequências

- O limite de sessões passa a ser consistente sob concorrência real.
- Uma falha após adquirir o lock não bloqueia permanentemente novos logins.
- Atualizações do toolchain chegam juntas e são avaliadas pelo mesmo CI.
- O build Docker e o job Dashboard usam exatamente o grafo validado localmente.

## Alternativas rejeitadas

| Alternativa | Motivo |
|---|---|
| Retry do teste concorrente | Mascara a corrida no produto |
| Mutex em memória | Não coordena múltiplas instâncias da API |
| Transação MongoDB | Exige replica set e altera a topologia aprovada |
| `npm ci --legacy-peer-deps` | Aceita grafo incompatível e reduz integridade |
| Ignorar majors do Dependabot | Evita o sintoma, mas não mantém o conjunto atualizado |
