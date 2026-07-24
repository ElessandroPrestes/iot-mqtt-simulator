# Classificação e proteção de dados

**Status:** vigente para o perfil de produção da `TASK-014`
**Owner:** Maintainer do projeto
**Referências:** `SPEC-006`, `ADR-006`, ASVS `V14.1.1`, `V14.1.2`, `V14.2.4`

## Níveis

| Nível | Definição | Exemplos no projeto |
|---|---|---|
| Público | Divulgação não causa impacto de segurança | SPA estática, documentação já publicada, resposta mínima de health |
| Interno | Dado operacional sem segredo, restrito ao ambiente e usuários autorizados | Leituras, sensores, alertas, thresholds, métricas agregadas, nomes de serviço |
| Confidencial | Identifica usuário/sessão/operação ou auxilia reconhecimento; acesso por necessidade | Username/ID/papel, IP em auditoria, correlation ID, metadados de sessão, logs operacionais |
| Restrito | Permite autenticação, personificação, descriptografia ou controle administrativo | Senha transitória, hashes Argon2id, semente/código TOTP, JWT/refresh, hashes de refresh, chaves privadas, secrets Grafana/Mongo, URI com credencial |

Conteúdo Base64/Base32, cookies, payload JWT decodificável e hashes de token
mantêm a classificação do dado original; codificação não reduz proteção.

## Requisitos por nível

| Controle | Público | Interno | Confidencial | Restrito |
|---|---|---|---|---|
| Acesso | Público somente quando listado | `viewer`/`operator` ou workload necessário | Menor privilégio e uso operacional explícito | Somente workload/administrador nomeado |
| Trânsito | HTTPS/WSS externo | TLS interno obrigatório | TLS/mTLS e hostname validados | TLS/mTLS; nunca URL/query |
| Armazenamento | Repositório/imagem permitidos | Banco/volume autorizado | Banco/log central protegido | Gestor externo; apenas hash quando possível; nunca Git/imagem |
| Browser | Permitido | Após autenticação | Memória necessária à sessão | Access token só em memória; refresh só HttpOnly; segredo nunca em JS |
| Cache | Conforme conteúdo | `no-store` sob `/api/v1` | `no-store` | `no-store`, sem cache intermediário |
| Logs | Permitido se útil | Somente campos inventariados | Minimizar e controlar acesso | Proibido; redação obrigatória |
| Cópia/exportação | Livre | Necessidade operacional | Mudança auditada | Proibida fora do lifecycle de secrets |
| Descarte | Normal | Conforme retenção | Exclusão ao fim da retenção | Revogação e destruição segura imediata |

No escopo atual, a proteção em repouso combina volumes isolados, menor
privilégio, armazenamento somente de hashes quando possível e gestor externo
para material Restrito. Se norma organizacional ou regulatória exigir
criptografia de disco/volume, o ambiente de deploy deve fornecê-la e
evidenciá-la; essa responsabilidade não pode ser declarada atendida pelo
container.

## Inventário e retenção

| Dado | Nível | Local autorizado | Retenção atual |
|---|---|---|---|
| Assets do Dashboard e health mínimo | Público | Imagem/edge | Vida da release |
| Readings e metadata industrial | Interno | MongoDB `iot_dashboard` | TTL automático de 7 dias |
| Alertas e estado de resolução | Interno | MongoDB `iot_dashboard` | Enquanto operacionalmente necessário; revisão trimestral |
| Métricas Prometheus | Interno | Volume `prometheus_data`, rede observability | Retenção configurada pelo deploy; não exportar publicamente |
| Username, ID, papel | Confidencial | Secret de principals; claims mínimos; auditoria autorizada | Vida do principal; claims até expirar; logs 30 dias |
| Sessão: family ID, atividade e expiração | Confidencial | MongoDB `sessions` | TTL na expiração absoluta, no máximo 8 horas |
| Estado anti-replay TOTP | Confidencial | MongoDB `authenticationstates` | Vida do principal; remover no desprovisionamento |
| Logs API/simulador/edge/dashboard/broker/Mongo | Confidencial | Volume próprio e Loki isolado | 30 dias no Loki |
| Password hash e semente TOTP | Restrito | Fonte externa e secret `auth_principals` | Vida do principal/versão |
| Chave JWT, refresh e hash do refresh | Restrito | Secret; cookie; MongoDB | JWT key conforme rotação; refresh/hash até expiração/revogação |
| Chaves privadas/certificados workload | Restrito | Fonte externa e Docker secrets | Certificado folha interno <=24 horas |
| Root Mongo/Grafana secrets | Restrito | Fonte externa e secrets dedicados | Conforme lifecycle; nunca disponíveis à API |

A ausência atual de TTL automático para alertas não autoriza armazenar dados
pessoais ou secrets nesse modelo. Mudança de finalidade ou exigência regulatória
requer ADR, prazo de retenção e mecanismo de exclusão antes da coleta.

## Fluxos permitidos

- Simulator → MQTT → API → MongoDB/Socket.io: somente telemetria validada;
- Browser → Nginx → API: credenciais apenas no login TLS; tokens conforme o
  modelo de sessão;
- API/serviços → volume próprio → Alloy → Loki: somente eventos inventariados,
  após redação quando aplicável;
- API → Prometheus: métricas agregadas e labels limitadas, sem secrets;
- gestor externo → arquivos de secret → workload: entrega unidirecional,
  efêmera e de menor privilégio.

Qualquer fluxo não listado deve ser tratado como proibido até atualização desta
classificação e do threat model.

## Evidência

- TTL de readings/sessions: `Reading.js` e `Session.js`;
- cache: `services/api/src/app.js` e `appSecurity.test.js`;
- cookies/tokens: `cookies.js`, `authService.js` e testes do store Dashboard;
- redação: `services/api/src/utils/redact.js` e `redact.test.js`;
- transporte e isolamento: `docker-compose.prod.yml` e
  `internalTlsConfig.test.js`;
- logs: [`logging-inventory.md`](logging-inventory.md).
