# SPEC-006: Hardening de Segurança OWASP

## Status

🟢 **Aprovada e emendada para fechamento integral do Level 2**

**Aprovação humana registrada em:** 2026-07-23 e 2026-07-24

## 1. Objetivo

Elevar a segurança do IoT MQTT Simulator antes da release, cobrindo os riscos do
**OWASP Top 10:2025** e do **OWASP API Security Top 10:2023**, com
**OWASP ASVS 5.0.0 Level 2** como nível-alvo de verificação para todos os
requisitos aplicáveis.

O resultado deve ser verificável por testes e evidências. Esta SPEC não autoriza
afirmar certificação ou conformidade integral com OWASP sem que a matriz ASVS
Level 2 esteja preenchida e todas as lacunas aplicáveis estejam encerradas.

## 2. Referenciais e nível-alvo

- [OWASP Top 10:2025](https://owasp.org/Top10/)
- [OWASP API Security Top 10:2023](https://owasp.org/API-Security/)
- [OWASP ASVS 5.0.0](https://owasp.org/www-project-application-security-verification-standard/)
- **Nível-alvo:** ASVS 5.0.0 Level 2 para a API, Dashboard, WebSocket e
  controles de infraestrutura dos quais a aplicação depende.
- Cada requisito ASVS aplicável deve ser registrado como `Pass`, `Fail` ou
  `N/A`, sempre com justificativa e evidência reproduzível.

O OWASP Top 10 é usado como modelo de riscos; o ASVS é usado como padrão
mensurável de verificação.

## 3. Contexto e riscos observados

| Evidência atual | Risco principal |
|---|---|
| Auto-login e credenciais padrão presentes no código do Dashboard/API | A07 Authentication Failures |
| Segredo JWT possui fallback conhecido quando a configuração está ausente | A04 Cryptographic Failures / A07 |
| Token de acesso persistido em `localStorage` | A07 / exposição em caso de XSS |
| CORS usa `*` como fallback na API e no Socket.io | A01 Broken Access Control / A02 |
| Socket.io aceita conexões e inscrições sem autenticação | A01 / API5 Broken Function Level Authorization |
| Login e mensagens MQTT não possuem validação Joi completa | A05 Injection / A10 |
| API e broker possuem portas publicadas diretamente na stack de produção | A02 Security Misconfiguration |
| Broker MQTT de produção usa transporte sem TLS | A04 Cryptographic Failures |
| CI não possui SAST, secret scanning, SBOM ou scan de imagens/dependências | A03 Software Supply Chain Failures |
| Eventos de autenticação/autorização não possuem auditoria e alertas próprios | A09 Security Logging and Alerting Failures |

## 4. Escopo

- **API Express:** autenticação, sessão, autorização, validação, limites de
  recursos, tratamento de erros, auditoria e configuração segura.
- **Dashboard Vue:** fluxo explícito de login/logout, proteção de rotas e
  armazenamento seguro de sessão.
- **Socket.io:** autenticação no handshake e autorização de eventos/rooms.
- **MQTT/Mosquitto:** validação de payload, ACL por tópico e transporte seguro
  no perfil de produção.
- **MongoDB:** autenticação no perfil de produção e credenciais injetadas sem
  valores padrão.
- **Nginx/Docker Compose:** TLS, redução da superfície exposta e headers.
- **CI/CD:** gates de dependências, código, segredos, imagens e artefatos.
- **Observabilidade:** eventos e alertas de segurança sem dados sensíveis.
- **Documentação de segurança:** threat model e matriz ASVS 5.0.0 Level 2.

## 5. Fora de escopo

- Certificação formal OWASP ou auditoria independente.
- Pentest externo contratado.
- SSO corporativo e OAuth/OIDC de terceiros.
- Enrollment e recovery self-service de MFA; o TOTP provisionado
  administrativamente passa a fazer parte do escopo.
- WAF, SIEM gerenciado, Kubernetes ou service mesh.
- Implementação da integração planejada com AWS IoT Core.
- Gestão completa de identidades multi-tenant ou autosserviço de cadastro.
- Correções sem relação com segurança.
- Execução da `TASK-013` ou criação da tag `v1.0.0`.

## 6. Requisitos

### 6.1. A01:2025 — Broken Access Control

- Toda rota e evento devem operar com **deny by default**.
- Permanecem públicos apenas:
  - `GET /health` e `GET /api/v1/health`, com resposta mínima;
  - `POST /api/v1/auth/login`;
  - endpoints de renovação de sessão estritamente necessários.
- `/metrics` deve ficar acessível somente na rede interna de observabilidade.
- `/api/docs` deve ser desabilitado por padrão em produção ou exigir papel
  autorizado.
- Devem existir os papéis:
  - `viewer`: leitura de sensores, leituras e alertas;
  - `operator`: permissões de `viewer` e resolução de alertas.
- O endpoint `PATCH /api/v1/alerts/:id/resolve` deve exigir `operator`.
- O Socket.io deve validar a sessão no handshake e autorizar subscriptions por
  papel. Conexões anônimas devem ser rejeitadas.
- IDs e nomes de rooms devem ser validados antes de qualquer consulta ou join.
- CORS deve usar allowlist explícita e falhar fechado quando não configurado em
  produção.

### 6.2. A02:2025 — Security Misconfiguration

- A API deve validar toda configuração no bootstrap e recusar inicialização em
  produção quando faltar segredo, credencial, origem CORS ou parâmetro
  obrigatório.
- Produção não pode possuir credenciais, segredos ou origens permissivas de
  fallback.
- Somente o Nginx deve publicar a aplicação para o host. API, MongoDB,
  Prometheus e listeners MQTT internos não devem ser expostos diretamente.
- Swagger deve ser controlado por `SWAGGER_ENABLED`.
- `trust proxy`, rate limiting e obtenção do IP devem ser configurados de forma
  compatível com um único proxy Nginx confiável.
- Headers de segurança devem possuir testes automatizados. Headers obsoletos
  não devem substituir CSP, HSTS, `frame-ancestors` e demais controles atuais.
- MongoDB deve exigir autenticação no perfil de produção.

### 6.3. A03:2025 — Software Supply Chain Failures

- Instalações de CI e imagens devem usar lockfiles e `npm ci`.
- Dependências de produção com vulnerabilidade `high` ou `critical` devem
  bloquear o CI quando houver correção disponível.
- O CI deve executar:
  - SAST;
  - secret scanning;
  - scan de dependências;
  - scan das imagens de produção;
  - geração de SBOM.
- GitHub Actions devem declarar permissões mínimas e ser fixadas por SHA.
- Imagens-base devem usar versões suportadas e referência imutável aprovada.
- Atualizações automáticas de dependências devem ser configuradas com revisão
  humana obrigatória.

### 6.4. A04:2025 — Cryptographic Failures

- Produção deve aceitar tráfego externo somente por TLS 1.2 ou 1.3 e redirecionar
  HTTP para HTTPS.
- Certificados e chaves devem ser montados como secrets/volumes ignorados pelo
  Git e nunca incorporados às imagens.
- O listener MQTT externo, quando habilitado, deve usar TLS e ACL; o listener
  plaintext deve permanecer restrito à rede Docker.
- JWT deve ter algoritmo permitido explicitamente, `issuer`, `audience`,
  expiração curta e segredo com no mínimo 256 bits.
- A inicialização deve falhar se o segredo JWT for fraco ou ausente.
- Tokens, senhas, chaves e URIs com credenciais não podem aparecer em logs,
  métricas, respostas ou documentação gerada.

### 6.5. A05:2025 — Injection

- Login, parâmetros de rota, querystrings e bodies devem possuir schemas Joi
  com allowlist, tamanho máximo e rejeição de propriedades desconhecidas.
- Payload MQTT deve validar tópico, `sensorId`, valor, unidade, timestamp,
  metadata e tamanho antes de usar ou persistir qualquer campo.
- Filtros MongoDB devem ser construídos apenas por campos permitidos; objetos e
  operadores recebidos do cliente devem ser rejeitados.
- Strings usadas em logs, métricas, rooms e mensagens de alerta devem ser
  normalizadas e limitadas.
- Testes negativos devem cobrir NoSQL injection, payloads malformados,
  prototype pollution e entradas acima dos limites.

### 6.6. A06:2025 — Insecure Design

- Deve ser criado um threat model em `docs/security/threat-model.md` contendo:
  ativos, atores, trust boundaries, fluxos REST/WebSocket/MQTT, ameaças,
  controles e riscos residuais.
- Devem ser documentados abuse cases para brute force, enumeração, replay de
  token, inscrição indevida em rooms, flood MQTT e exaustão de recursos.
- Limites de negócio e recursos devem existir por fluxo, não apenas um rate
  limiter HTTP global.
- Alterações no modelo de sessão, autorização e transporte devem ser
  formalizadas em ADR antes da implementação.

### 6.7. A07:2025 — Authentication Failures

- O auto-login e todas as credenciais hardcoded devem ser removidos.
- O Dashboard deve possuir login e logout explícitos, feedback genérico de
  falha e guards de navegação.
- A credencial administrativa inicial deve ser fornecida como hash Argon2id por
  secret de ambiente; senha em texto puro não deve ser persistida.
- O access token JWT deve:
  - expirar em no máximo 15 minutos;
  - existir somente em memória no Dashboard;
  - nunca ser armazenado em `localStorage` ou `sessionStorage`.
- A renovação deve usar refresh token opaco, aleatório, rotativo e armazenado
  apenas como hash no MongoDB. O cookie deve ser `HttpOnly`, `Secure` em
  produção, `SameSite=Strict` e possuir escopo mínimo.
- Logout e reutilização detectada de refresh token devem revogar a sessão.
- Login deve possuir limite dedicado de no máximo 5 tentativas por 15 minutos,
  sem permitir enumeração de usuários.
- A validação JWT deve restringir algoritmo, emissor e audiência.

### 6.8. A08:2025 — Software or Data Integrity Failures

- Artefatos, imagens e dependências consumidos no pipeline devem ter origem e
  integridade verificáveis.
- O pipeline não pode executar código de PR com secrets privilegiados.
- Claims de papel e identidade devem vir apenas de tokens validados; valores
  enviados no body/query nunca podem alterar autorização.
- Refresh tokens devem ser de uso único e ter rotação atômica.
- Builds de produção devem ser reproduzíveis a partir dos lockfiles e do commit
  identificado no SBOM.

### 6.9. A09:2025 — Security Logging and Alerting Failures

- Logs estruturados devem incluir correlation ID e eventos para login,
  falha de autenticação, falha de autorização, rate limit, logout, revogação,
  falha de validação MQTT e alteração de estado de alerta.
- Logs não devem conter senha, token, cookie, segredo ou payload sensível.
- Métricas Prometheus devem evitar labels de cardinalidade não limitada.
- Devem existir alertas provisionados para brute force, picos de `401/403/429`,
  erros `5xx` e rejeições MQTT anormais.
- Relógios e timestamps devem usar UTC e formato ISO 8601.

### 6.10. A10:2025 — Mishandling of Exceptional Conditions

- Erros devem falhar fechado e manter o envelope canônico sem stack trace em
  produção.
- Devem existir handlers para `unhandledRejection` e `uncaughtException` com
  logging seguro e encerramento controlado.
- Dependências externas devem possuir timeout, retry limitado e comportamento
  explícito quando indisponíveis.
- Mensagens MQTT inválidas devem ser rejeitadas sem persistência ou broadcast e
  contabilizadas de forma segura.
- Health check não deve reportar `healthy` quando uma dependência obrigatória
  estiver indisponível.
- Testes devem cobrir falhas de MongoDB, MQTT, JWT, configuração, parsing e
  encerramento, garantindo que nenhuma condição excepcional conceda acesso.

### 6.11. Emenda ASVS Level 2 de 2026-07-24

A triagem individual encontrou 34 requisitos aplicáveis em `Fail`. Para manter o
nível-alvo aprovado, a implementação deve também:

- exigir senha + TOTP em produção, impedir reutilização do mesmo código e
  rejeitar hashes Argon2id abaixo dos parâmetros mínimos;
- vincular access JWT a uma família de sessão ativa, incluir `typ=at+jwt` e
  invalidar imediatamente tokens após logout, revogação ou desabilitação;
- impor inatividade máxima de 30 minutos, vida absoluta de 8 horas e até três
  famílias concorrentes por principal;
- permitir ao usuário listar/revogar suas sessões e a um principal
  `securityAdmin` revogar qualquer sessão;
- usar TLS 1.2/1.3 com validação de hostname/CA em todas as conexões internas;
- usar certificados cliente individuais e de curta duração para Nginx,
  Prometheus, API, Simulator, Alloy e Grafana;
- substituir senha MQTT por mTLS/identidade de certificado e senha MongoDB da
  API por `MONGODB-X509` com usuário de mínimo privilégio;
- exigir gestor de secrets como fonte de verdade em produção e limitar o
  provisionamento local/CI a material efêmero;
- centralizar logs via Grafana Alloy e Loki atrás de gateway mTLS, com volumes
  separados, retenção, exclusão desabilitada e sem acesso de escrita pela
  aplicação;
- versionar inventário de logs, classificação de dados, matriz de autorização
  por campo, política/inventário criptográfico e SLA de vulnerabilidades;
- aplicar `Cache-Control: no-store` a respostas autenticadas e de sessão;
- fixar e testar cipher suites aprovadas;
- exigir certificado publicamente confiável para o edge no deploy real.

Não é permitido encerrar a TASK classificando qualquer um desses fluxos
existentes como `N/A`.

## 7. Critérios de aceite

- [ ] Threat model aprovado e versionado.
- [ ] ADR de autenticação/sessão/transporte aprovado antes do código.
- [ ] Matriz ASVS 5.0.0 Level 2 contém todos os requisitos aplicáveis com
      evidência; não existem itens `Fail` no encerramento.
- [ ] As dez categorias OWASP Top 10:2025 possuem ao menos um teste ou
      evidência de controle aplicável.
- [ ] A matriz OWASP API Security Top 10:2023 está coberta ou justificada como
      `N/A`.
- [ ] Não existem credenciais ou segredos padrão no código e nas imagens.
- [ ] Produção falha ao iniciar com configuração insegura ou incompleta.
- [ ] Dashboard não realiza auto-login e não persiste tokens em Web Storage.
- [ ] REST e Socket.io rejeitam acesso anônimo/sem papel com `401` ou `403`.
- [ ] Login bloqueia brute force conforme o limite definido.
- [ ] Login de produção exige TOTP e rejeita replay.
- [ ] Logout e revogação invalidam access token imediatamente.
- [ ] Inatividade, concorrência e administração de sessões passam nos testes.
- [ ] Entradas HTTP e MQTT inválidas são rejeitadas e testadas.
- [ ] Apenas Nginx publica tráfego da aplicação; TLS e headers passam nos testes.
- [ ] Todas as conexões internas usam TLS/mTLS com validação de certificado.
- [ ] MQTT e MongoDB autenticam a API/Simulator por certificado e mínimo
      privilégio, sem credencial backend estática.
- [ ] CI bloqueia vulnerabilidades corrigíveis `high`/`critical`, secrets
      detectados, falhas SAST e imagens inseguras.
- [ ] Logs e alertas de segurança são verificáveis sem exposição de segredos.
- [ ] Logs são centralizados em sistema logicamente separado e sem permissão de
      alteração pela aplicação.
- [ ] Inventários, políticas, matriz por campo e classificação de dados estão
      versionados e coerentes com a matriz ASVS.
- [ ] Suítes existentes continuam verdes e os thresholds de cobertura do projeto
      são mantidos.
- [ ] DAST baseline contra a stack de produção não apresenta alerta `high`.
- [ ] `PROJECT.md`, README, OpenAPI e runbooks são atualizados somente após
      implementação, testes e review aprovados.
- [ ] Nenhuma ação da `TASK-013` é executada como parte desta entrega.

## 8. ADRs referenciados

- [ADR-001 — Arquitetura de Microserviços baseada em Eventos](../adr/ADR-001-architecture.md)
- [ADR-003 — Push em Tempo Real via Socket.io](../adr/ADR-003-realtime.md)
- [ADR-004 — Monitoramento e Logs via Winston e Prometheus](../adr/ADR-004-observability.md)
- [ADR-005 — Pipeline de Integração Contínua](../adr/ADR-005-cicd.md)
- [ADR-006 — Autenticação, sessão, autorização, secrets e transporte seguro](../adr/ADR-006-security-session-transport.md),
  incluindo a emenda ASVS Level 2 de 2026-07-24.

## 9. Task relacionada

- [TASK-014 — Hardening de Segurança OWASP](../tasks/TASK-014-owasp-security-hardening.md)

## 10. Aprovação humana

- [x] Escopo e nível ASVS aprovados.
- [x] Estratégia de sessão proposta aprovada.
- [x] Exceções e riscos residuais iniciais aprovados.
- [x] Implementação autorizada.
- [x] Manutenção do alvo ASVS Level 2 aprovada em 2026-07-24.
- [x] MFA, sessões revogáveis, TLS/mTLS interno, identidades de workload,
      gestão de secrets e logs centralizados autorizados.
- [x] Implementação da emenda autorizada.
