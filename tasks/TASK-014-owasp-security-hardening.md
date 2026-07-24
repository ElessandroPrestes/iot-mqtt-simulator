# TASK-014: Hardening de Segurança OWASP

## Status

🟠 **Em andamento — review com changes requested**

A SPEC-006 foi aprovada por humano em 2026-07-23. Esta TASK deve ser concluída
antes de qualquer release v1.0.0. Os controles de aplicação e infraestrutura
foram implementados e testados. O review de 2026-07-23 permanece bloqueado pela
triagem ASVS, por requisitos arquiteturais incompatíveis com o ADR-006 atual e
por evidências operacionais pendentes. A TASK-013 continua bloqueada.

## Fase

**3 — Segurança e Produção**

## SPEC associada

[SPEC-006 — Hardening de Segurança OWASP](../specs/SPEC-006-owasp-security-hardening.md)

## Prioridade

**P0 — Crítica / bloqueadora de release**

## Problema

O projeto possui autenticação JWT básica, mas ainda mantém defaults inseguros,
auto-login, token em Web Storage, WebSocket anônimo, superfície de produção
exposta e pipeline sem gates de segurança. Esses pontos impedem atingir o nível
alvo OWASP ASVS 5.0.0 Level 2 e cobrir adequadamente OWASP Top 10:2025.

## Pré-condições

- [x] SPEC-006 aprovada explicitamente por humano.
- [x] ADR de autenticação, sessão, autorização, secrets e TLS aprovado.
- [x] Baseline ASVS e threat model revisados.
- [x] Nenhuma atividade da TASK-013 iniciada.

## Progresso

- [x] ADR-006 proposto.
- [x] Threat model STRIDE criado.
- [x] Baseline ASVS 5.0.0 Level 2 criada.
- [x] Matriz OWASP Top 10 Web/API criada.
- [x] ADR-006 e riscos residuais aprovados por humano.
- [x] Implementação iniciada.
- [x] Hardening de API, Dashboard, Socket.io e ingestão MQTT implementado.
- [x] Stack de produção com TLS externo, secrets, ACL e portas internas testada.
- [x] Testes, audits, Trivy e ZAP executados localmente.
- [x] Review formal executado.
- [x] Todos os 253 requisitos ASVS Level 1/2 triados individualmente:
      118 `Pass`, 101 `N/A` e 34 `Fail`.
- [ ] Apontamentos do review resolvidos.
- [ ] Aprovação final do Review Agent e do risco residual.

## 1. Artefatos e modificações necessárias

### 1.1. Arquitetura e evidências

- `adr/ADR-006-security-session-transport.md` (NOVO): decisões de autenticação,
  access/refresh token, RBAC, TLS e secrets.
- `docs/security/threat-model.md` (NOVO): ativos, trust boundaries, ameaças,
  abuse cases, controles e riscos residuais.
- `docs/security/asvs-5.0.0-level-2.md` (NOVO): matriz `Pass/Fail/N/A` com
  evidências.
- `docs/security/owasp-top-10-mapping.md` (NOVO): mapeamento Top 10 Web 2025 e
  API 2023 para controles e testes.

### 1.2. API

- `services/api/src/config/`:
  - validar configuração no bootstrap;
  - eliminar fallbacks inseguros;
  - separar defaults permitidos apenas em `development/test`.
- `services/api/src/routes/auth.js`:
  - validar entrada;
  - emitir access token curto;
  - criar rotação/revogação de refresh token;
  - adicionar logout e refresh.
- `services/api/src/middleware/authenticate.js`:
  - fixar algoritmo, issuer e audience;
  - padronizar erros sem revelar detalhes.
- `services/api/src/middleware/authorize.js` (NOVO):
  - implementar RBAC `viewer`/`operator` com deny by default.
- `services/api/src/middleware/securityAudit.js` (NOVO):
  - correlation ID e eventos de auditoria sem segredos.
- `services/api/src/middleware/validate.js`:
  - rejeitar campos desconhecidos e padronizar limites.
- `services/api/src/models/Session.js` (NOVO):
  - persistir somente hash do refresh token, expiração, rotação e revogação.
- `services/api/src/routes/*.js`:
  - aplicar autorização e schemas Joi a params/query/body.
- `services/api/src/services/mqttService.js`:
  - validar tópico e payload antes de métricas, persistência ou broadcast;
  - limitar payload/metadata e contabilizar rejeições.
- `services/api/src/websocket/socketServer.js`:
  - autenticar handshake;
  - autorizar rooms/eventos;
  - limitar conexões e subscriptions.
- `services/api/src/middleware/errorHandler.js` e
  `services/api/src/index.js`:
  - fail closed;
  - ocultar detalhes internos;
  - tratar exceções de processo com shutdown controlado.
- `services/api/src/services/metricsService.js`:
  - adicionar métricas de segurança com cardinalidade limitada.
- `services/api/src/config/swagger.js`:
  - condicionar exposição por ambiente/configuração.
- `services/api/package.json` e lockfile:
  - adicionar somente dependências justificadas e auditadas.

### 1.3. Dashboard

- `services/dashboard/src/App.vue`:
  - remover auto-login e credenciais hardcoded.
- `services/dashboard/src/views/LoginView.vue` (NOVO):
  - login explícito com mensagem genérica de erro.
- `services/dashboard/src/stores/auth.js` (NOVO):
  - manter access token somente em memória;
  - executar refresh, logout e limpeza de sessão.
- `services/dashboard/src/api/client.js`:
  - remover Web Storage;
  - renovar sessão de forma controlada, sem loop infinito.
- `services/dashboard/src/router/index.js`:
  - guards para sessão e papéis.
- `services/dashboard/src/composables/useSocket.js`:
  - autenticar handshake e reagir a expiração/revogação.
- Testes do Dashboard:
  - provar ausência de auto-login e persistência em Web Storage;
  - cobrir login, logout, guards, refresh e falhas.

### 1.4. Infraestrutura e transporte

- `.env.example`:
  - documentar variáveis sem valores utilizáveis como segredo;
  - incluir issuer/audience, hashes, TLS, CORS e feature flags.
- `docker-compose.prod.yml`:
  - publicar somente o Nginx;
  - habilitar autenticação do MongoDB;
  - injetar secrets sem defaults;
  - aplicar `read_only`, usuário não-root, capabilities mínimas e healthchecks
    onde suportado.
- `infrastructure/nginx/nginx.conf` e
  `infrastructure/nginx/conf.d/default.conf`:
  - TLS 1.2/1.3, redirect HTTP→HTTPS, headers atuais;
  - limites específicos para login/API/WebSocket;
  - métricas e Swagger não públicos por padrão.
- `services/broker/mosquitto.conf`:
  - ACL por tópico;
  - TLS no listener externo;
  - listener plaintext restrito à rede interna.
- `services/broker/acl` (NOVO):
  - API somente subscribe nos tópicos necessários;
  - simulator somente publish nos tópicos necessários.
- Arquivos reais de senha, certificado e chave devem continuar fora do Git.

### 1.5. Supply chain e CI

- `.github/workflows/ci.yml`:
  - permissões mínimas;
  - actions fixadas por SHA;
  - `npm audit` para dependências de produção;
  - SAST, secret scanning, scan de imagens e SBOM;
  - DAST baseline na stack de produção;
  - gates consolidados em `ci-ok`.
- `.github/dependabot.yml` (NOVO):
  - atualizações npm, GitHub Actions e Docker com revisão humana.
- `.gitignore`:
  - revisar padrões de secrets e evidenciar teste de não rastreamento.

## 2. Ordem de implementação

1. Criar baseline ASVS, threat model e matriz OWASP.
2. Elaborar e obter aprovação do ADR-006.
3. Adicionar testes de segurança que reproduzem as lacunas atuais.
4. Validar configuração e remover defaults/credenciais hardcoded.
5. Implementar autenticação, sessão rotativa, logout e RBAC.
6. Proteger REST, Socket.io, métricas e Swagger.
7. Validar e limitar entradas HTTP/MQTT e consumo de recursos.
8. Aplicar TLS, ACL MQTT, autenticação MongoDB e isolamento de portas.
9. Implementar auditoria, métricas e alertas de segurança.
10. Adicionar gates de supply chain, SAST, secrets, imagens, SBOM e DAST.
11. Executar testes funcionais, negativos, integração e regressão.
12. Realizar Review Agent contra SPEC-006 e ASVS; corrigir via Refactor Agent.
13. Atualizar documentação canônica somente após aprovação do review.
14. Solicitar nova aprovação humana antes de qualquer ação de release.

## 3. Estratégia de commits

Usar commits pequenos, revisáveis e convencionais, por exemplo:

1. `docs(security): adiciona threat model e baseline ASVS`
2. `test(security): cobre riscos de autenticação e autorização`
3. `fix(security): remove defaults inseguros de produção`
4. `feat(auth): implementa sessão rotativa e RBAC`
5. `fix(security): protege websocket e valida payloads MQTT`
6. `fix(infra): restringe exposição e habilita TLS`
7. `chore(ci): adiciona gates de supply chain`
8. `docs(security): registra evidências OWASP`

Não misturar release, changelog ou tag nesses commits.

## 4. Checklist de validação

### A01 — Broken Access Control

- [x] REST aplica deny by default e RBAC.
- [x] `viewer` não resolve alertas; `operator` resolve.
- [x] Socket.io rejeita handshake anônimo e room inválida.
- [x] Métricas e Swagger não ficam públicos em produção.
- [x] CORS rejeita origem não autorizada.

### A02 — Security Misconfiguration

- [x] Produção falha sem configuração segura.
- [x] Não existem fallbacks de segredo/credencial.
- [x] Apenas Nginx publica a aplicação.
- [x] Headers e `trust proxy` possuem testes.
- [x] MongoDB exige autenticação em produção.

### A03/A08 — Supply Chain e Integrity

- [x] Lockfiles são usados com `npm ci`.
- [x] SAST e secret scanning passam no GitHub Actions.
- [x] Dependency e image scanning não possuem falha bloqueadora.
- [x] SBOM identifica commit e artefatos.
- [x] Actions usam SHA e permissões mínimas.

### A04 — Cryptographic Failures

- [x] TLS externo aceita apenas TLS 1.2/1.3.
- [x] HTTP redireciona para HTTPS.
- [x] JWT rejeita algoritmo, issuer e audience inválidos.
- [x] Segredos fracos/ausentes impedem bootstrap.
- [x] MQTT externo permanece desabilitado; o listener interno usa autenticação
      e ACL.

### A05 — Injection

- [x] Login, params, queries e bodies rejeitam entradas fora do schema.
- [x] NoSQL injection e prototype pollution possuem testes.
- [x] MQTT inválido não é persistido nem transmitido.
- [x] Payloads acima dos limites retornam/repercutem erro controlado.

### A06 — Insecure Design

- [x] Threat model e abuse cases foram aprovados.
- [x] ADR-006 foi aprovado.
- [x] Rate limits específicos foram testados.
- [ ] Riscos residuais têm owner e justificativa.

### A07 — Authentication Failures

- [x] Não existe auto-login nem credencial hardcoded.
- [x] Access token não é persistido no browser.
- [x] Refresh token é rotativo, revogável e armazenado somente como hash.
- [x] Logout revoga a sessão.
- [x] Brute force recebe `429` após o limite.
- [x] Mensagem de login não permite enumeração.

### A09 — Logging and Alerting

- [x] Eventos de segurança possuem correlation ID.
- [x] Logs não contêm tokens, cookies, senhas ou secrets.
- [ ] Alertas de brute force, `401/403/429`, `5xx` e rejeição MQTT disparam em
      teste.
- [x] Labels Prometheus possuem cardinalidade limitada.

### A10 — Exceptional Conditions

- [x] Erros falham fechado e não expõem stack em produção.
- [x] Exceções de processo causam shutdown controlado.
- [x] Falhas de MongoDB/MQTT/JWT/configuração possuem testes.
- [x] Health check reflete dependências obrigatórias.

### Gates finais

- [x] Testes da API, Dashboard e Simulator passam.
- [x] Cobertura mínima do projeto é mantida.
- [x] DAST baseline não apresenta alerta `high`.
- [x] Matriz ASVS contém uma linha auditável para cada um dos 253 requisitos.
- [ ] Matriz ASVS 5.0.0 Level 2 não possui item aplicável em `Fail`.
- [ ] Review Agent: `Approved`.
- [ ] `PROJECT.md`, README, OpenAPI e runbooks refletem o estado testado.
- [x] Nenhuma alteração de `CHANGELOG.md`, tag `v1.0.0` ou merge de release foi
      realizada.

## 5. Critério de conclusão

A TASK só pode ser marcada como concluída quando todos os gates finais estiverem
atendidos, as evidências estiverem versionadas e houver aprovação humana do
risco residual. Isso não equivale a certificação OWASP independente.
