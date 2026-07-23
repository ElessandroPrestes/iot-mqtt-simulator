# Mapeamento OWASP Top 10 — TASK-014

**Status:** Baseline aprovada para implementação
**Data:** 2026-07-23
**Aprovação humana:** 2026-07-23

## 1. OWASP Top 10:2025

| Categoria | Evidência atual | Controle previsto | Evidência final esperada | Baseline |
|---|---|---|---|---|
| A01 Broken Access Control | REST apenas autenticado; Socket/RBAC ausentes | Deny by default, RBAC e Socket auth | Testes 401/403 e matriz de papéis | Fail |
| A02 Security Misconfiguration | Wildcard fallback e portas públicas | Config fail-fast e isolamento | Testes de bootstrap/Compose/headers | Fail |
| A03 Software Supply Chain Failures | Lockfiles, CI básico | SHA/digest, audit, SAST, secret/image scan, SBOM | Jobs CI e relatórios | Partial |
| A04 Cryptographic Failures | JWT com fallback; sem TLS | Secret file, JWT estrito, TLS/WSS/MQTTS | Testes TLS/JWT e config | Fail |
| A05 Injection | Joi parcial | Schemas HTTP/MQTT e allowlists | Testes NoSQL/prototype/payload | Fail |
| A06 Insecure Design | ADRs gerais | ADR-006, threat model e abuse cases | Aprovação e riscos residuais | Partial |
| A07 Authentication Failures | Auto-login e token persistente | Argon2id, login explícito, refresh rotation | Testes login/logout/replay/rate | Fail |
| A08 Software or Data Integrity Failures | Lockfiles | Artefatos imutáveis, rotação atômica, SBOM | CI e testes de replay | Partial |
| A09 Security Logging and Alerting Failures | Winston/Prometheus genéricos | Auditoria, métricas e alertas dedicados | Testes e regras provisionadas | Fail |
| A10 Mishandling of Exceptional Conditions | Error handler parcial | Fail closed, shutdown e falhas simuladas | Testes negativos/de dependências | Partial |

## 2. OWASP API Security Top 10:2023

| Categoria | Aplicabilidade | Controle previsto | Baseline |
|---|---|---|---|
| API1 Broken Object Level Authorization | IDs de sensor/alerta | Validação, papéis e testes de objetos | Fail |
| API2 Broken Authentication | Login/JWT/refresh | ADR-006 e controles A07 | Fail |
| API3 Broken Object Property Level Authorization | Bodies/metadata | Schemas com unknown=false e DTOs | Fail |
| API4 Unrestricted Resource Consumption | HTTP/Socket/MQTT | Quotas por fluxo e payload | Fail |
| API5 Broken Function Level Authorization | Resolve alert | RBAC operator | Fail |
| API6 Unrestricted Access to Sensitive Business Flows | Login/resolve | Anti-automation e audit | Fail |
| API7 Server Side Request Forgery | Sem fetch por URL atualmente | Bloquear/allowlist se introduzido | N/A atual |
| API8 Security Misconfiguration | Infra e defaults | Config fail-fast/TLS/isolation | Fail |
| API9 Improper Inventory Management | Swagger e rotas | OpenAPI validada e exposição por flag | Partial |
| API10 Unsafe Consumption of APIs | MQTT é input externo | Schema e trust boundary explícita | Fail |

## 3. Matriz de testes planejada

| Controle | Tipo de teste |
|---|---|
| Autenticação/JWT/refresh | Unitário + integração + replay |
| RBAC/BOLA/BFLA | Integração por papel e objeto |
| CORS/headers/TLS | Integração Nginx e smoke de produção |
| Socket.io | Integração de handshake, role, room e quota |
| MQTT | Unitário de schema + integração ACL/broker |
| NoSQL/prototype pollution | Testes negativos HTTP e MQTT |
| Rate/resource limits | Integração com 429/rejeição |
| Logging/redaction | Unitário e captura estruturada |
| Supply chain | Jobs CI bloqueadores |
| Exceptional conditions | Falhas simuladas Mongo/MQTT/config/JWT |
| DAST | OWASP ZAP baseline contra stack efêmera |

## 4. Gate

- [x] Categorias Web Top 10 mapeadas.
- [x] Categorias API Top 10 mapeadas.
- [x] Controles e tipos de evidência definidos.
- [ ] Controles implementados.
- [ ] Testes e evidências anexados.
- [ ] Nenhuma categoria aplicável permanece `Fail`.
