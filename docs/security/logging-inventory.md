# Inventário operacional de logs

**Status:** vigente para o perfil de produção da `TASK-014`
**Owner:** Maintainer do projeto
**Retenção central:** 30 dias (`720h`)
**Referências:** ASVS `V16.1.1`, `V16.2.3`, `V16.2.4`, `V16.4.2`, `V16.4.3`

## Topologia autorizada

Cada produtor grava em volume próprio. O Alloy monta esses volumes somente para
leitura, acrescenta `service_name`, `environment=production` e `filename`, e
envia por mTLS ao gateway Loki. O gateway aceita somente certificados de Alloy
e Grafana e usa mTLS até o Loki. Loki e seu volume existem apenas na rede
`observability`; aplicações não montam `loki_data`.

Console/stdout continua autorizado para diagnóstico imediato do runtime, mas
não é o registro durável. Nenhum outro arquivo, host remoto ou serviço de logs é
autorizado sem atualização deste inventário.

## Produtores

| `service_name` | Eventos | Formato/fuso | Arquivo/volume | Uso |
|---|---|---|---|---|
| `api` | requests HTTP, bootstrap/dependências, erros, auditoria de auth/RBAC/sessão/validação/rate limit, MQTT | JSON Winston com ISO-8601 UTC; request Morgan encapsulado em JSON | `/var/log/iot-api/application.log` / `api_logs` | investigação, correlação, detecção e resposta |
| `simulator` | conexão/reconexão MQTT, falha de publish e anomalia sintética | JSON com ISO-8601 UTC | `/var/log/iot-simulator/application.log` / `simulator_logs` | disponibilidade e origem de telemetria |
| `edge` | acesso externo, status, bytes, referer, user-agent, IP; erros Nginx | texto Nginx com timestamp | `/var/log/iot-edge/{access,error}.log` / `edge_logs` | trilha de entrada, DAST e diagnóstico TLS/proxy |
| `dashboard` | acesso e erros do Nginx interno | texto Nginx com timestamp | `/var/log/iot-dashboard/{access,error}.log` / `dashboard_logs` | entrega da SPA e falhas upstream |
| `broker` | conexão mTLS, identidade, tópico, subscribe/publish, ACL e erros | texto Mosquitto com timestamp | `/mosquitto/log/mosquitto.log` / `broker_logs` | autoria MQTT, ACL e disponibilidade |
| `mongo` | startup, autenticação X.509, conexões, queries lentas/erros e lifecycle | JSON estruturado MongoDB com timestamp | `/var/log/mongodb/mongod.log` / `mongo_logs` | persistência, autenticação e diagnóstico |

Alloy lê os seis formatos como linhas e permite correlação no Loki por
timestamp, `service_name`, `environment` e `filename`. Nos fluxos HTTP e de
segurança da API, `correlationId`/`X-Request-ID`, `principalId`, `role`,
`event` e `outcome` acrescentam correlação causal. Formatos que não carregam o
request ID ainda podem ser correlacionados por janela temporal, identidade de
workload, status e serviço; mudança que exija tracing distribuído demanda nova
SPEC.

## Eventos de segurança da API

| Evento | Outcomes/campos úteis | Uso |
|---|---|---|
| `auth.login` | `success`, `failure`, `limited`; principal somente no sucesso | brute force e acesso |
| `auth.refresh`, `auth.logout` | `success`, `failure` | lifecycle de sessão |
| `auth.access`, `auth.authorization`, `auth.websocket` | `success`/`denied`, motivo limitado, papel/principal quando conhecidos | negação e tentativa de elevação |
| `auth.browser_request` | `denied` | origem/header não confiável |
| `auth.session_revoke`, `auth.session_admin_revoke` | `success`/`denied` | revogação própria/administrativa |
| `input.validation` | `denied`, target | entrada inválida sem conteúdo bruto |
| `http.rate_limit` | `limited` | abuso/DoS |
| `alert.resolve` | `success`, `alertId`, principal | ação de negócio auditável |
| `mqtt.message_rejected` | motivo normalizado e tópico validado/limitado | telemetria malformada/indevida |
| `process.*` | erro, stack somente no log protegido | falha excepcional/bootstrap |

## Campos proibidos

Nunca registrar:

- senha, hash Argon2id, semente ou código TOTP;
- JWT, refresh token, cookie, header Authorization ou chave de API;
- chave privada, secret Grafana/Mongo/JWT, conteúdo de arquivo secret;
- URI com senha, body de login ou payload bruto não validado;
- dado adicional de pessoa ou indústria sem classificação e necessidade.

A API redige chaves sensíveis e padrões Bearer/JWT/URI antes da serialização.
Edge/broker/Mongo não devem receber secrets em URL, username ou tópico. Detecção
de secret em log é incidente: restringir acesso, preservar evidência, rotacionar
o material e seguir o runbook de comprometimento.

## Acesso, integridade e retenção

- produtores: escrita somente no próprio volume;
- Alloy UID 473: leitura somente; grupos suplementares 999/1883 servem apenas
  para arquivos `0640` de Mongo/Mosquitto;
- Loki: único escritor de `loki_data`; API, Dashboard, Simulator, broker,
  MongoDB e edge não acessam a rede/volume central;
- Grafana: autenticação anônima desabilitada e datasource mTLS;
- gateway: cliente X.509 obrigatório, allowlist de subjects, métodos apenas
  `GET`/`POST`;
- API de exclusão Loki: bloqueada no gateway e `deletion_mode: disabled`;
- retenção: compactor Loki habilitado por 30 dias; expiração é o único descarte
  normal;
- acesso humano: somente por Grafana autenticado na rede/túnel administrativo.

Alterar, exportar ou reduzir retenção requer mudança auditável e revisão humana.
Não há garantia de WORM contra administrador do host; o controle fornecido é
separação lógica, menor privilégio, API de exclusão desabilitada e acesso
administrativo controlado.

## Alertas e verificação

Prometheus alerta sobre brute force, negações, rate limit, 5xx e rejeições MQTT
em `infrastructure/prometheus/alerts.yml`. O gate operacional deve:

1. confirmar os seis `service_name` pela API `/loki/api/v1/series`;
2. confirmar `400` sem certificado cliente;
3. confirmar `403` para `DELETE`;
4. confirmar falha de escrita do Alloy nos volumes fonte;
5. verificar ausência de erro de tail/envio no Alloy;
6. testar saúde do datasource Loki no Grafana.

Evidências: `docker-compose.prod.yml`, `infrastructure/alloy/config.alloy`,
`infrastructure/loki/*`, `observabilityConfig.test.js` e job DAST do CI.
