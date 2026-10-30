# SPEC-011: Atualização de dependências e imagens base para restaurar gates de segurança

## Metadados

| Campo | Valor |
|---|---|
| ID | SPEC-011 |
| Status | Approved (Aprovado) |
| Responsável | Engenharia e Segurança |
| Revisores | Produto / Engenharia / QA / Segurança |
| Criado | 2026-10-29 |
| Atualizado | 2026-10-29 |
| Liberação Alvo | Manutenção de segurança local, sem release público |
| Refs: | Discovery: run `40975301907` do CI; Design: N/A — sem alteração de interface; ADRs: `adr/ADR-005-cicd.md`, `adr/ADR-006-security-session-transport.md` |

## Problema e resultado

O CI da branch `develop` falhou no run `40975301907` nos gates de segurança,
sem relação com a mudança de bootstrap de segredos do compose:

- `npm audit --omit=dev --audit-level=high` reprovou a API e o Dashboard por
  advisories publicados após o último run verde;
- o Trivy reprovou as imagens `api`, `simulator` e `dashboard` por
  vulnerabilidades corrigíveis HIGH/CRITICAL em pacotes Alpine e em dependências
  Node embutidas na imagem da API.

Resultado desejado: gates de segurança verdes, com atualização não disruptiva de
dependências e imagens base, preservando comportamento, contratos e testes.

## Escopo

### No escopo

- Atualizar `services/api/package-lock.json` e
  `services/dashboard/package-lock.json` com `npm audit fix` (sem `--force`).
- Atualizar os digests de `node:22-alpine` e `nginx:alpine` nos Dockerfiles.
- Aplicar `apk upgrade --no-cache` nas imagens de produção para absorver
  correções publicadas pelo Alpine.
- Validar testes e build dos serviços afetados.
- Registrar a manutenção em `CHANGELOG.md`, revisão e matriz de rastreabilidade.

### Fora do escopo

- `npm audit fix --force`, upgrades breaking (por exemplo `echarts` 6 e `vite`
  fora da faixa declarada).
- Alterar comportamento, contratos de API, schema de dados ou interface.
- Corrigir vulnerabilidades moderadas de dependências de desenvolvimento que não
  bloqueiam o gate.
- Release, tag, merge em `main` ou deploy.

## Comportamento funcional

- A API e o Dashboard mantêm o comportamento observável atual.
- As suítes de teste existentes continuam passando.
- O build do Dashboard continua produzindo o bundle.
- O gate `npm audit --omit=dev --audit-level=high` passa nos dois serviços.
- As imagens continuam construindo com os mesmos targets.

## Requisitos não-funcionais

- Segurança: priorizar correções com versões compatíveis; não mascarar achados
  com exceções.
- Confiabilidade: validar testes antes de publicar a mudança.
- Reprodutibilidade: manter digests de imagem explícitos.
- Observabilidade: registrar a atualização no changelog e na matriz.

## Critérios de aceitação

### AC-001

```yaml
id: AC-001
title: Audit da API sem HIGH/CRITICAL de produção
preconditions:
  - services/api/package-lock.json atualizado
action: Executar npm audit --omit=dev --audit-level=high em services/api
expected_result: Código de saída 0
evidence_type: automated
```

### AC-002

```yaml
id: AC-002
title: Audit do Dashboard sem HIGH/CRITICAL de produção
preconditions:
  - services/dashboard/package-lock.json atualizado
action: Executar npm audit --omit=dev --audit-level=high em services/dashboard
expected_result: Código de saída 0
evidence_type: automated
```

### AC-003

```yaml
id: AC-003
title: Testes da API passam
preconditions:
  - Dependências atualizadas
action: Executar npm test em services/api
expected_result: Suíte verde
evidence_type: automated
```

### AC-004

```yaml
id: AC-004
title: Testes e build do Dashboard passam
preconditions:
  - Dependências atualizadas
action: Executar npm test e npm run build em services/dashboard
expected_result: Ambos verdes
evidence_type: automated
```

### AC-005

```yaml
id: AC-005
title: Imagens sem vulnerabilidades corrigíveis HIGH/CRITICAL
preconditions:
  - Dockerfiles atualizados
action: Construir imagens e executar Trivy com ignore-unfixed e severity HIGH,CRITICAL
expected_result: Nenhum achado corrigível bloqueante
evidence_type: automated
```

### AC-006

```yaml
id: AC-006
title: Sem mudança de comportamento
preconditions:
  - Alterações aplicadas
action: Revisar diff de código-fonte e contratos
expected_result: Apenas lockfiles, Dockerfiles e documentação foram alterados
evidence_type: manual
```

## Abordagem técnica

- `npm audit fix` em `services/api` e `services/dashboard`.
- Atualização dos digests de `node:22-alpine` e `nginx:alpine`.
- `RUN apk upgrade --no-cache` nos estágios `base`/produção aplicáveis.
- Execução das suítes e do build; validação final pelo CI.

## Entrega e operações

- Plano de implantação: commits na branch `develop` com push.
- Plano de migração: N/A — sem migração de dados.
- Plano de rollback: reverter os commits de lockfile/Dockerfile.
- Monitoramento: run de CI e logs dos gates.

## Riscos e dependências

| Risco ou dependência | Impacto | Probabilidade | Mitigação | Responsável |
|---|---|---|---|---|
| Atualização transitiva quebrar testes | Regressão | Média | Executar suítes completas antes do push | Engenharia |
| Novo advisory durante a correção | CI continuar vermelho | Média | Reexecutar audit e rebuild no CI | Segurança |
| `apk upgrade` reduzir determinismo | Variação entre builds | Baixa | Digests fixos + CI por commit | Engenharia |
| Correção exigir upgrade breaking | Escopo maior | Baixa | Avaliar SPEC separada; não usar `--force` | Engenharia |

## Questões abertas

| Questão | Responsável | Data limite | Resolução |
|---|---|---|---|
| Nenhuma | — | — | — |

## Aprovação

| Papel | Nome | Decisão | Data | Notas |
|---|---|---|---|---|
| Produto | Responsável do projeto | Approved | 2026-10-29 | Instrução explícita para acompanhar o CI até ficar verde |
| Design | N/A | N/A | 2026-10-29 | Sem alteração de interface |
| Engenharia | Responsável do projeto | Approved | 2026-10-29 | Manutenção de dependências e imagens |
| Segurança | Engenharia | Approved | 2026-10-29 | Correções compatíveis, sem exceções |
| QA | Engenharia | Ready | 2026-10-29 | Testes, build e CI como evidência |
