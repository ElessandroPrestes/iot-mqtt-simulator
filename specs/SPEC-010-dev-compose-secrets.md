# SPEC-010: Bootstrap de segredos do compose de desenvolvimento

## Metadados

| Campo | Valor |
|---|---|
| ID | SPEC-010 |
| Status | Approved (Aprovado) |
| Responsável | Engenharia e Documentação |
| Revisores | Produto / Engenharia / QA |
| Criado | 2026-10-29 |
| Atualizado | 2026-10-29 |
| Liberação Alvo | Correção local de ergonomia e segurança do compose de desenvolvimento |
| Refs: | Discovery: falha reproduzida em `docker compose build` (`services.grafana.environment.[]`); Design: N/A — sem alteração de interface; ADRs: `adr/ADR-006-security-session-transport.md` (gestão de secrets) |

## Problema e resultado

O compose de desenvolvimento (`docker-compose.yml`) exige
`GF_SECURITY_ADMIN_PASSWORD` por interpolação obrigatória
(`${GF_SECURITY_ADMIN_PASSWORD:?...}`). Nem `.env.example` nem o `.env` local
documentam ou fornecem esse valor. Consequências:

- `make build` / `docker compose build` falham antes de construir qualquer
  imagem;
- a API também exige `JWT_SECRET` com no mínimo 32 caracteres em runtime, e
  `.env.example` o deixa vazio, então `make up` falharia depois do build;
- a falha é segura (fail-closed), mas não existe caminho documentado e
  reproduzível para preparar os segredos de desenvolvimento.

Resultado desejado: `make build` e `make up` funcionam em uma estação local após
um único comando de bootstrap, gerando segredos aleatórios, sem valor padrão
conhecido e sem versionar segredos.

## Escopo

### No escopo

- Adicionar `scripts/local/dev-env.sh`, idempotente, que:
  - cria `.env` a partir de `.env.example` quando ausente;
  - gera `JWT_SECRET` e `GF_SECURITY_ADMIN_PASSWORD` aleatórios apenas quando
    ausentes ou vazios;
  - restringe a permissão de `.env` quando possível;
  - falha de forma explícita quando `openssl` não estiver disponível.
- Expor o alvo `make dev-env` e fazer `make build` e `make up` dependerem dele.
- Documentar as variáveis em `.env.example`, `README.md` e `PROJECT.md`.
- Registrar a correção em `CHANGELOG.md`.
- Registrar revisão em `reviews/` e regenerar a matriz de rastreabilidade.

### Fora do escopo

- Alterar `docker-compose.prod.yml`, o lifecycle local seguro ou o CI.
- Alterar código de produto, contratos de API, testes de runtime ou modelos.
- Definir valores padrão conhecidos para segredos.
- Release, tag, merge em `main` ou deploy.

## Comportamento funcional

- `make dev-env` pode ser executado repetidamente sem sobrescrever segredos já
  preenchidos.
- Se `.env` não existir, ele é criado a partir de `.env.example` antes da
  geração.
- `JWT_SECRET` gerado possui 64 caracteres hexadecimais (mínimo exigido: 32).
- `GF_SECURITY_ADMIN_PASSWORD` gerado possui 32 caracteres hexadecimais.
- Valores vazios são tratados como ausentes.
- Nenhum segredo é escrito em arquivos versionados; `.env` permanece ignorado.
- A interpolação obrigatória do compose é preservada: sem o segredo, o comando
  continua falhando com mensagem explícita.

## Requisitos não-funcionais

- Segurança: segredos aleatórios por estação, sem default e sem log de valor.
- Confiabilidade: bootstrap idempotente e com falha explícita.
- Compatibilidade: `sh` POSIX, Linux/macOS, sem dependência de Node.js.
- Observabilidade: mensagens claras sobre criação e geração.
- Acessibilidade: N/A — sem interface.
- Desempenho: execução em tempo desprezível.

## Critérios de aceitação

### AC-001

```yaml
id: AC-001
title: Bootstrap preenche segredos ausentes
preconditions:
  - .env sem JWT_SECRET e sem GF_SECURITY_ADMIN_PASSWORD
action: Executar make dev-env
expected_result: As duas variáveis passam a existir com valores aleatórios não vazios
evidence_type: automated
```

### AC-002

```yaml
id: AC-002
title: Bootstrap é idempotente
preconditions:
  - AC-001 executado
action: Executar make dev-env novamente e comparar os valores
expected_result: Os valores existentes são preservados
evidence_type: automated
```

### AC-003

```yaml
id: AC-003
title: Compose de desenvolvimento interpola após o bootstrap
preconditions:
  - AC-001 executado
action: Executar docker compose config -q
expected_result: O comando termina sem erro de interpolação
evidence_type: automated
```

### AC-004

```yaml
id: AC-004
title: Fail-closed preservado
preconditions:
  - .env sem GF_SECURITY_ADMIN_PASSWORD
action: Executar docker compose config -q
expected_result: O comando falha citando GF_SECURITY_ADMIN_PASSWORD
evidence_type: automated
```

### AC-005

```yaml
id: AC-005
title: Documentação e exemplo atualizados
preconditions:
  - Alterações aplicadas
action: Inspecionar .env.example, README.md e PROJECT.md
expected_result: As variáveis obrigatórias e o comando make dev-env estão documentados
evidence_type: manual
```

### AC-006

```yaml
id: AC-006
title: Nenhum segredo versionado
preconditions:
  - Alterações aplicadas
action: Verificar git status e .gitignore
expected_result: .env permanece ignorado e nenhum valor gerado aparece em arquivos rastreados
evidence_type: automated
```

## Abordagem técnica

- Script POSIX em `scripts/local/dev-env.sh` com funções `current_value` e
  `set_value` baseadas em `awk`, geração via `openssl rand -hex`.
- `Makefile`: alvo `dev-env`; `build` e `up` passam a depender dele.
- `.env.example`: variáveis documentadas com instrução de geração.
- `README.md`: nota no fluxo de desenvolvimento e troubleshooting do erro.
- `PROJECT.md`: comandos e variáveis críticas.
- `CHANGELOG.md`: entrada em `[Unreleased]`.

## Entrega e operações

- Plano de implantação: commit na branch `develop`.
- Plano de migração: N/A — sem migração de dados.
- Plano de rollback: reverter o commit; o `.env` local pode ser apagado e
  recriado.
- Monitoramento e alertas: N/A — sem runtime alterado.

## Riscos e dependências

| Risco ou dependência | Impacto | Probabilidade | Mitigação | Responsável |
|---|---|---|---|---|
| `openssl` ausente na estação | Bootstrap não gera segredos | Baixa | Falha explícita com instrução | Engenharia |
| Script sobrescrever segredo existente | Perda de credenciais locais | Baixa | Só gera quando valor está vazio | Engenharia |
| `.env` criado com permissões amplas | Exposição local | Baixa | `chmod 600` quando suportado | Engenharia |
| Default conhecido reintroduzido | Regressão de segurança | Baixa | Manter interpolação `:?` e ausência de default | Segurança |

## Questões abertas

| Questão | Responsável | Data limite | Resolução |
|---|---|---|---|
| Nenhuma | — | — | — |

## Aprovação

| Papel | Nome | Decisão | Data | Notas |
|---|---|---|---|---|
| Produto | Responsável do projeto | Approved | 2026-10-29 | Instrução explícita para corrigir o erro do compose usando SDD |
| Design | N/A | N/A | 2026-10-29 | Sem alteração de interface |
| Engenharia | Responsável do projeto | Approved | 2026-10-29 | Correção de bootstrap local sem mudança de produto |
| QA | Engenharia | Ready | 2026-10-29 | Validação por comandos reproduzíveis do compose |
