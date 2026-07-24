# Matriz de autorização

**Status:** vigente para o perfil de produção da `TASK-014`
**Owner:** Maintainer do projeto
**Modelo:** deny by default; decisão no servidor
**Referências:** `SPEC-006`, `ADR-006`, ASVS `V8.1.2`

## Identidades

| Identidade | Limite |
|---|---|
| Anônimo | Edge, login/refresh/logout e health estritamente necessários |
| `viewer` | Leitura de sensores, leituras e alertas; Socket.io |
| `operator` | Permissões de `viewer` e resolução de alertas |
| `securityAdmin` | Atributo administrativo separado, provisionado somente para `operator`, que permite revogar sessão de outro principal |
| Prometheus | Certificado cliente próprio; somente `/metrics` |
| Simulator | Certificado `CN=simulator`; somente publish MQTT |
| API processor | Certificado `CN=api-processor`; subscribe MQTT e `readWrite` apenas em `iot_dashboard` |
| Healthcheck | Certificado `CN=healthcheck`; somente publish no tópico `healthcheck` |

Papel, `securityAdmin`, principal e sessão vêm da configuração confiável e do
token validado. Body, query, headers comuns e mensagens do cliente nunca podem
elevá-los.

## REST e superfície HTTP

| Operação | Anônimo | `viewer` | `operator` / campo administrativo | Campos permitidos |
|---|---:|---:|---:|---|
| `GET /health` | Sim | Sim | Sim | Resposta mínima de status, versão, timestamp e estado das dependências |
| `GET /api/v1/health` | Sim | Sim | Sim | Mesmo contrato; `Cache-Control: no-store` |
| `POST /api/v1/auth/login` | Sim | Sim | Sim | Entrada: `username`, `password`, `totp`; saída: `accessToken`, `expiresIn`, `user{id,username,role}` e cookie refresh HttpOnly |
| `POST /api/v1/auth/refresh` | Cookie | Cookie | Cookie | Sem body; rotaciona cookie e retorna os mesmos campos públicos do login |
| `POST /api/v1/auth/logout` | Cookie/sem sessão | Cookie | Cookie | Sem body; revoga a família quando presente e remove o cookie |
| `GET /api/v1/auth/sessions` | Não | Próprias | Próprias | Somente `familyId`, `createdAt`, `lastActivityAt`, `expiresAt` |
| `DELETE /api/v1/auth/sessions/:familyId` | Não | Própria | Própria | UUID v4 no path; body vazio; não aceita `principalId` do cliente |
| `DELETE /api/v1/auth/admin/sessions/:principalId/:familyId` | Não | Não | Somente `securityAdmin=true` | IDs validados; body vazio; nenhuma alteração adicional |
| `GET /api/v1/readings` | Não | Sim | Sim | Filtros `sensorId,type,status,from,to,limit,page`; leitura do DTO completo |
| `GET /api/v1/readings/latest` | Não | Sim | Sim | Sem entrada; leitura do DTO completo |
| `GET /api/v1/readings/stats` | Não | Sim | Sim | Query `since`; somente agregados definidos pelo serviço |
| `GET /api/v1/sensors` | Não | Sim | Sim | `sensorId,type,lastValue,lastUnit,lastStatus,lastSeen,metadata` |
| `GET /api/v1/sensors/:id` | Não | Sim | Sim | ID e `limit` validados; DTO de leitura |
| `GET /api/v1/alerts` | Não | Sim | Sim | Filtros `sensorId,level,resolved,from,to,limit,page`; DTO de alerta |
| `GET /api/v1/alerts/summary` | Não | Sim | Sim | Somente `total,unresolved,critical,warning` |
| `PATCH /api/v1/alerts/:id/resolve` | Não | Não | `operator` | Body obrigatoriamente vazio; servidor altera somente `resolved` e `resolvedAt` |
| `GET /metrics` | Não | Não | Não por papel | Somente Prometheus pela rede interna e mTLS |
| `/api/docs` | Não em produção | Não | Não | Desabilitado por default; qualquer habilitação exige nova decisão |
| Qualquer rota não listada | Não | Não | Não | `404`; nenhum fallback de autorização |

As rotas de autenticação que alteram sessão também exigem `Origin` permitido e
`X-Requested-With: XMLHttpRequest`. Todas as respostas sob `/api/v1` usam
`Cache-Control: no-store`.

## WebSocket

| Operação | `viewer` | `operator` | Regra de campo/recurso |
|---|---:|---:|---|
| Handshake | Sim | Sim | `auth.token` Bearer válido, `typ=at+jwt`, sessão ativa e principal habilitado |
| Receber `reading:new` e `alert:new` | Sim | Sim | Somente DTO produzido pela API |
| `subscribe:sensor` | Sim | Sim | Um `sensorId` no padrão aprovado; máximo de 50 subscriptions por socket |
| `unsubscribe:sensor` | Sim | Sim | Apenas room derivada do `sensorId` validado |
| Eventos/rooms não listados | Não | Não | Sem handler; nunca aceitar nome arbitrário de room |

## MQTT e MongoDB

| Workload | Recurso | Acesso |
|---|---|---|
| Simulator | `factory/sensors/+/+` | publish |
| API processor | `factory/sensors/+/+` | subscribe |
| Healthcheck | `healthcheck` | publish |
| Qualquer outro certificado/tópico | MQTT | deny |
| API processor | banco `iot_dashboard` | papel MongoDB `readWrite` |
| API processor | `admin`, outros bancos e administração | deny |
| Root MongoDB | bootstrap/administração | não montado nem usado pela API |

## Controles e testes

- montagem deny-by-default: `services/api/src/app.js`;
- papéis: `services/api/src/middleware/authorize.js`;
- sessão e atributo administrativo:
  `services/api/src/middleware/authenticate.js` e
  `services/api/src/routes/auth.js`;
- fields/allowlists: `services/api/src/routes/*.js`;
- WebSocket: `services/api/src/websocket/socketServer.js`;
- workloads: `services/broker/acl` e
  `infrastructure/mongodb/10-create-x509-user.js`;
- testes: `alerts.test.js`, `auth.test.js`, `authorize.test.js`,
  `authenticate.test.js`, `socketServer.test.js` e `internalTlsConfig.test.js`.

Qualquer nova rota, evento, papel, campo gravável ou workload exige atualizar
esta matriz e adicionar teste negativo antes da implementação.
