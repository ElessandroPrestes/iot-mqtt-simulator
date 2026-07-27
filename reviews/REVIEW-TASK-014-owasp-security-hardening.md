# Review — TASK-014: Hardening de Segurança OWASP

## Target

- TASK: `TASK-014`
- SPEC: `SPEC-006`
- ADR: `ADR-006`
- Branch: `develop`
- Commit revisado: `a092ac9`
- Revisão inicial: 2026-07-23
- Revisão anterior: 2026-07-24
- Revisão final do escopo local: 2026-07-27

## Status

- [x] Approved
- [ ] Approved with remarks
- [ ] Rejected

O responsável humano removeu explicitamente deploy público e remoto do escopo
antes do novo ciclo de implementação. ADR-006 e SPEC-006 foram emendados antes
do código. A entrega continua exercitando o perfil seguro completo em loopback,
com MFA, sessões revogáveis, TLS/mTLS interno, identidades X.509, isolamento de
redes e logs centralizados.

Não existem achados bloqueadores no commit revisado.

## Decisão sobre os apontamentos anteriores

### R-014-06 — Resolvido por decisão de escopo — Certificado público

O texto oficial de `V12.2.2` se aplica a serviços external-facing. A entrega
aprovada não possui DNS público, ingress externo, ambiente remoto ou usuário
remoto; o único edge é `https://localhost:8443`.

`V12.2.2` está corretamente classificado como `N/A`, com justificativa
individual e gate dormente. Qualquer futura exposição pública exige novo ciclo
SDD e reabre o requisito.

### R-014-07 — Resolvido — Gestão local de secrets

`V13.3.1` não exige produto externo específico; exige solução que crie,
armazene, controle acesso e destrua backend secrets. No ambiente alvo local:

- `prepare-dast-secrets.sh` gera secrets aleatórios e PKI de curta duração;
- `secure-stack.sh` usa diretório temporário `0700` fora do Git;
- Docker secrets entrega somente o material necessário a cada workload;
- credenciais humanas exigem comando local explícito e arquivo `0600`;
- o teardown remove containers, volumes, certificados, chaves e credenciais.

O ciclo criação→execução→destruição→recriação foi exercitado. A stack recriada
permaneceu saudável com material novo.

## Evidências verificadas

| Gate | Resultado | Evidência |
|---|---|---|
| API | Pass | 31 suites, 190 testes; 95,38% lines, 97,36% functions e 86,12% branches |
| Dashboard | Pass | 59 testes e build Vite |
| Simulator | Pass | 28 testes |
| Matriz ASVS | Pass | 253 linhas: 151 `Pass`, 102 `N/A`, zero `Fail` |
| Documentação de segurança | Pass | 8 testes estruturais |
| Lifecycle local | Pass | criação, permissões, entrega, teardown e recriação |
| TLS local | Pass | TLS 1.2 e hostname válidos com CA local; TLS 1.1 rejeitado |
| Aplicação | Pass | Dashboard servido, redirect 308, login MFA e leitura autenticada |
| MQTT/MongoDB | Pass | Simulator publicou; API persistiu e retornou leituras |
| Superfície | Pass | somente Nginx publica `8080/8443` no projeto isolado |
| Health | Pass | API, MongoDB e MQTT saudáveis após recriação |
| CI remoto anterior | Pass | run `30113368217` no commit `95518ea` |
| Release/deploy | Pass | nenhum deploy, tag, changelog ou ação da TASK-013 |

## Observação não bloqueadora

O comando canônico do Dashboard continua sendo `npm test` seguido de
`npm run build`, conforme o CI. O comando auxiliar `npm run test:coverage`
gera relatório, mas o baseline amplo do frontend ainda fica abaixo dos
thresholds declarados no Vitest. Isso é anterior a `a092ac9`, não regrediu com
esta alteração e não existe cobertura mínima de Dashboard definida no
`PROJECT.md`; deve ser tratado em ciclo próprio de qualidade, sem bloquear a
execução local aprovada.

## Decisão

`TASK-014` está aprovada para o escopo exclusivamente local definido pela
SPEC-006 emendada. Isso não constitui certificação OWASP e não autoriza deploy
público. Um futuro ambiente externo exigirá nova arquitetura, nova
especificação, certificado publicamente confiável e gestor operacional de
secrets.
