# Review — TASK-014: Hardening de Segurança OWASP

## Target

- TASK: `TASK-014`
- SPEC: `SPEC-006`
- ADR: `ADR-006`
- Branch: `develop`
- Commit revisado: `c28464b`
- Revisão inicial: 2026-07-23
- Nova revisão executada em: 2026-07-24

## Status

- [ ] Approved
- [ ] Approved with remarks
- [x] Rejected — Changes Requested

O refactor corrigiu e evidenciou 32 dos 34 requisitos ASVS originalmente em
`Fail`. TLS/mTLS interno, identidades X.509, sessões revogáveis, MFA e logs
centralizados/protegidos estão alinhados à emenda aprovada do ADR-006 e da
SPEC-006. O pipeline remoto passa integralmente.

A aprovação ainda é impossível porque dois requisitos Level 2 aplicáveis
dependem de evidência operacional externa que não existe no repositório:
certificado público no edge real (`V12.2.2`) e gestor externo de secrets como
fonte de verdade (`V13.3.1`). Ambos permanecem `Fail`, sem exceção aprovada.

## Check-list base

- Código está de acordo com `standards/coding.md`? **Sim.**
- Existem testes adequados e passando? **Sim.**
- Nenhum escopo extra foi adicionado? **Sim.**
- Documentação de segurança reflete integralmente o estado testado? **Sim; a
  matriz preserva os dois bloqueios sem afirmar conformidade integral.**
- README foi atualizado antes da aprovação? **Não, corretamente; permanece
  adiado conforme o fluxo SDD.**

## Evidências verificadas

| Gate | Resultado | Evidência |
|---|---|---|
| API | Pass | 31 suites, 189 testes e cobertura acima do gate |
| Dashboard | Pass | 59 testes e build Vite |
| Simulator | Pass | 28 testes e cobertura acima do gate |
| Matriz ASVS | Parcial | 253 linhas: 150 `Pass`, 2 `Fail`, 101 `N/A`; teste estrutural automatizado |
| Dependency audit | Pass no gate | API sem advisory; Dashboard com advisory moderate rastreado até 2026-08-23 |
| Imagens | Pass | 0 high/critical em API, Dashboard e Simulator |
| DAST | Pass | Local: 0 high/medium/low; remoto: gate high e observabilidade mTLS aprovados |
| Stack de produção | Pass | TLS/mTLS, autenticação, ACL, X.509, seis streams de log e isolamento validados |
| GitHub Actions | Pass | Run `30112871440`: dez jobs obrigatórios em `success` |
| Release | Pass | Nenhuma tag, changelog, README de aprovação ou ação da TASK-013 |

Evidência remota consolidada:
[`run 30112871440`](https://github.com/ElessandroPrestes/iot-mqtt-simulator/actions/runs/30112871440).
O run anterior `30111549157` também passou e demonstrou a correção determinística
do probe mTLS do Loki.

## Apontamentos anteriores

### R-014-01 — Resolvido — Matriz ASVS

A matriz contém exatamente 253 requisitos e todas as linhas possuem estado,
justificativa, controle, teste, evidência e owner. O teste
`securityDocumentation.test.js` prova a cardinalidade `150 Pass / 2 Fail /
101 N/A` e os IDs dos dois bloqueios restantes.

### R-014-02 — Resolvido — Comunicação e identidade backend

O perfil de produção usa TLS 1.2/1.3 com validação de CA/hostname em todas as
conexões internas. MQTT e MongoDB usam certificados cliente individuais;
`CN=api-processor` tem somente `readWrite` no banco da aplicação. Os controles
foram verificados por testes estáticos, unitários e pela stack isolada.

### R-014-03 — Resolvido — Proteção e centralização de logs

API, Simulator, edge, Dashboard, Broker e Mongo gravam em volumes próprios.
Alloy os monta somente para leitura e envia por mTLS ao gateway/Loki isolado.
Retenção é `720h`, exclusão está desabilitada e o CI exige os seis streams,
rejeição sem certificado e datasource Grafana saudável.

### R-014-04 — Resolvido — Gates dependentes do GitHub

Os runs `30111549157` e `30112871440` passaram. O último contém testes, builds,
audits, CodeQL, Gitleaks, três scans de imagem/SBOM, DAST e gate consolidado.

### R-014-05 — Resolvido no gate — Dependências moderadas

O pacote `uuid` não utilizado foi removido e a API não possui advisory. O
advisory raiz do Dashboard continua moderate e não viola o gate high/critical;
há owner `Maintainer`, prazo de 2026-08-23, mitigação atual e plano de upgrade
major/testes em `docs/security/vulnerability-management.md`.

## Apontamentos bloqueadores atuais

### R-014-06 — P0 — Certificado público do edge

`v5.0.0-V12.2.2` permanece `Fail`. CI e testes locais usam certificado
autoassinado efêmero, adequado ao ambiente isolado, mas isso não prova cadeia
pública, hostname, validade e revogação no endpoint real.

**Ação:** provisionar o certificado publicamente confiável no ambiente de
produção ou staging equivalente e anexar a saída reproduzível do gate
`docs/security/production-certificate-gate.md`.

### R-014-07 — P0 — Fonte de verdade externa para secrets

`v5.0.0-V13.3.1` permanece `Fail`. A aplicação consome arquivos de secret e o CI
gera PKI/credenciais efêmeras corretamente, mas nenhum Vault ou serviço
gerenciado equivalente foi integrado e exercitado.

**Ação:** escolher e integrar o gestor aprovado; evidenciar injeção sem segredo
no repositório, rotação, revogação, auditoria e destruição conforme
`docs/security/secrets-lifecycle.md`.

Não existe exceção aprovada para nenhum dos dois apontamentos. O Review Agent
não pode fabricar evidência operacional nem reduzir o nível ASVS aprovado.

## Decisão de release

`TASK-014` permanece **em andamento / Changes Requested** e bloqueia a
`TASK-013`. Nenhuma atualização final do README, tag `v1.0.0` ou ação de release
deve ocorrer enquanto `R-014-06` e `R-014-07` não forem evidenciados, as duas
linhas ASVS não migrarem para `Pass` e este parecer não for substituído por
`Approved`.
