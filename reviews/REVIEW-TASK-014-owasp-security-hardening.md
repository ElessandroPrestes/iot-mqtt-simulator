# Review — TASK-014: Hardening de Segurança OWASP

## Target

- TASK: `TASK-014`
- SPEC: `SPEC-006`
- ADR: `ADR-006`
- Branch: `develop`
- Revisão executada em: 2026-07-23

## Status

- [ ] Approved
- [ ] Approved with remarks
- [x] Rejected — Changes Requested

A implementação fecha os riscos prioritários identificados no threat model e
passa nos testes funcionais, negativos, de imagem e DAST executados localmente.
Entretanto, os gates finais da própria TASK ainda não permitem aprovação:
a matriz ASVS não foi concluída e há requisitos Level 2 aplicáveis que não são
atendidos pela arquitetura aceita no ADR-006.

## Check-list base

- Código está de acordo com `standards/coding.md`? **Sim.**
- Existem testes adequados e passando? **Sim, para os controles
  implementados.**
- Nenhum escopo extra foi adicionado? **Sim.**
- Documentação canônica reflete integralmente o estado testado? **Não; deve ser
  atualizada somente depois de os apontamentos bloqueadores serem resolvidos.**

## Evidências verificadas

| Gate | Resultado | Evidência |
|---|---|---|
| API | Pass | 26 suites, 149 testes; 95,84% linhas e 87,04% branches |
| Dashboard | Pass | 11 arquivos, 58 testes e build Vite |
| Simulator | Pass | 24 testes |
| Dependency audit | Pass no gate | 0 high/critical nos três serviços |
| Imagens | Pass | Trivy 0.70.0: 0 high/critical em API, Dashboard e Simulator |
| DAST | Pass | ZAP: 0 high, 0 medium e 0 low; 3 informativos de cache/SPA |
| Stack de produção | Pass | Todos os seis serviços essenciais healthy |
| Superfície externa | Pass | HTTP 308; HTTPS health 200; docs/metrics 404; anônimo 401 |
| TLS | Pass externo | TLS 1.2 aceito e TLS 1.1 rejeitado |
| Release | Pass | Nenhuma tag, changelog ou ação da TASK-013 realizada |

O primeiro image scan detectou 4 vulnerabilidades altas e 1 crítica no npm
embutido na imagem Node. O refactor removeu npm/npx do runtime e passou no scan
subsequente. Os relatórios locais ficaram em `/tmp/iot-trivy-results` e
`/tmp/iot-dast-local`; o CI está configurado para produzir artefatos duráveis.

## Apontamentos requeridos

### R-014-01 — P0 — Matriz ASVS incompleta

`docs/security/asvs-5.0.0-level-2.md` ainda registra 253 requisitos como triagem
pendente. A SPEC proíbe afirmar atendimento ao nível-alvo sem uma linha
`Pass/Fail/N/A`, justificativa e evidência por requisito.

**Ação:** concluir a triagem individual e manter todo item aplicável diferente
de `Pass` como bloqueador explícito.

### R-014-02 — P0 — Comunicação interna e credenciais backend

O ADR-006 aceita HTTP e MQTT plaintext dentro das redes Docker e credenciais
persistentes para MongoDB/MQTT. Isso conflita, ao menos, com:

- `v5.0.0-V12.3.1`: TLS em conexões inbound/outbound da aplicação;
- `v5.0.0-V12.3.3`: TLS entre serviços HTTP internos;
- `v5.0.0-V13.2.1`: autenticação backend sem credenciais estáticas.

Não é correto classificar esses requisitos como `N/A`, pois os fluxos existem e
estão no escopo da SPEC-006.

**Ação:** obter decisão humana antes de alterar arquitetura. As opções válidas
são ampliar o ADR/SPEC para mTLS/TLS interno e identidades de curta duração, ou
alterar formalmente o nível-alvo e aceitar as exceções com owner e prazo. O
Review Agent não pode tomar essa decisão.

### R-014-03 — P1 — Proteção e centralização de logs

Auditoria estruturada, redação, métricas e alertas foram implementados, mas a
stack não demonstra armazenamento de logs protegido contra alteração nem envio
para sistema logicamente separado. Permanecem sem evidência:

- `v5.0.0-V16.4.2`;
- `v5.0.0-V16.4.3`.

**Ação:** definir e aprovar o destino operacional de logs, retenção, acesso,
integridade e transporte antes de classificar esses itens como `Pass`.

### R-014-04 — P1 — Gates dependentes do GitHub

Testes, audits, Trivy e ZAP foram reproduzidos localmente. CodeQL, Gitleaks e a
geração/publicação de SBOM estão configurados no workflow, mas ainda não existe
execução do GitHub Actions para estes commits.

**Ação:** executar o pipeline no repositório remoto e anexar os resultados antes
do review final.

### R-014-05 — P2 — Dependências moderadas

- API: `uuid` possui um advisory moderate em APIs UUID não utilizadas pelo
  projeto;
- Dashboard: `echarts`/`vue-echarts` possuem advisory moderate; o input exibido
  é numérico e validado, reduzindo a explorabilidade.

O gate aprovado bloqueia high/critical, portanto estes itens não reprovam
isoladamente a TASK. Ainda assim, a exceção precisa de owner, prazo e teste de
upgrade major.

## Decisão de release

`TASK-014` permanece **em andamento** e bloqueia a `TASK-013`. Nenhuma tag
`v1.0.0` deve ser criada enquanto este review não for substituído por
`Approved` e os gates finais da TASK não estiverem completos.

