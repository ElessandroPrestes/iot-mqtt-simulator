# ADR-006: Autenticação, sessão, autorização, secrets e transporte seguro

**Status:** Proposto — aguardando aprovação humana  
**Data:** 2026-07-23  
**SPEC:** [SPEC-006](../specs/SPEC-006-owasp-security-hardening.md)  
**TASK:** [TASK-014](../tasks/TASK-014-owasp-security-hardening.md)

## Contexto

O projeto possui uma API Express, um Dashboard Vue, comunicação Socket.io,
ingestão MQTT, MongoDB e um proxy Nginx. A autenticação atual usa credenciais e
segredo JWT com fallback, realiza auto-login no Dashboard, persiste o access
token em `localStorage` e não autentica o Socket.io. A stack de produção também
publica serviços internos diretamente.

A SPEC-006 define OWASP ASVS 5.0.0 Level 2 como nível-alvo. Para implementar os
controles sem decisões contraditórias entre API, frontend e infraestrutura, é
necessário fixar previamente o modelo de identidade, sessão, autorização,
secrets e transporte.

## Drivers

- Remover credenciais e segredos utilizáveis do código e das imagens.
- Evitar exposição de tokens a JavaScript persistente e reduzir replay.
- Aplicar autorização consistente em REST e Socket.io.
- Preservar a simplicidade de um case empresarial sem criar cadastro público.
- Falhar fechado quando produção estiver configurada de forma insegura.
- Manter desenvolvimento local reproduzível, explicitamente separado de
  produção.
- Produzir controles verificáveis para ASVS Level 2.

## Decisão proposta

### 1. Identidades

- Não haverá cadastro público, recuperação de senha ou gerenciamento
  multi-tenant nesta entrega.
- Os principals iniciais serão carregados de um arquivo montado como secret,
  indicado por `AUTH_PRINCIPALS_FILE`.
- O arquivo conterá apenas:
  - identificador estável;
  - username normalizado;
  - hash Argon2id;
  - papel `viewer` ou `operator`;
  - flag `enabled`.
- Senha em texto puro não será aceita na configuração de produção.
- O repositório conterá somente um exemplo sem hash utilizável. O arquivo real
  será ignorado pelo Git e nunca copiado para a imagem.
- Comparação de username não permitirá enumeração por diferença de resposta ou
  tempo observável relevante.

### 2. Access token

- A API emitirá JWT de acesso assinado com `HS256`.
- A chave terá no mínimo 256 bits aleatórios e será lida de
  `JWT_SECRET_FILE`; variável direta será permitida apenas em `test`.
- Claims obrigatórias:
  - `sub`: identificador do principal;
  - `role`: `viewer` ou `operator`;
  - `iss`: valor de `JWT_ISSUER`;
  - `aud`: valor de `JWT_AUDIENCE`;
  - `jti`, `iat` e `exp`.
- Duração máxima: 15 minutos.
- Verificação fixará algoritmo, issuer e audience.
- O Dashboard manterá o access token somente em memória no store Pinia.
- O token será enviado como `Authorization: Bearer` para REST e no campo
  `auth.token` do handshake Socket.io.

### 3. Refresh token e sessão

- O refresh token será opaco, gerado com CSPRNG e terá no mínimo 256 bits.
- O browser receberá somente o cookie `__Host-refresh`:
  - `HttpOnly`;
  - `Secure` em produção;
  - `SameSite=Strict`;
  - `Path=/`;
  - sem atributo `Domain`.
- A coleção `sessions` armazenará apenas SHA-256 do token, `principalId`,
  `familyId`, criação, expiração, uso e revogação.
- Duração absoluta máxima da sessão: 8 horas.
- Cada refresh rotacionará o token de forma atômica. Reutilização de token já
  consumido revogará toda a família.
- Logout revogará a família e apagará o cookie.
- Login, refresh e logout validarão `Origin` contra allowlist e exigirão JSON
  mais header `X-Requested-With`, garantindo preflight CORS para chamadas
  cross-origin.
- Reiniciar a página usará o refresh cookie para recuperar uma sessão; não
  haverá auto-login com credenciais.

### 4. Autorização

- O servidor aplicará deny by default.
- `viewer`:
  - leitura de sensores, readings e alerts;
  - conexão Socket.io e subscription em sensores válidos.
- `operator`:
  - todas as permissões de `viewer`;
  - resolução de alertas.
- `PATCH /api/v1/alerts/:id/resolve` exigirá `operator`.
- Papel recebido em body, query ou headers não confiáveis será ignorado.
- REST e Socket.io compartilharão as mesmas funções de validação de principal e
  papel.

### 5. Superfície pública e transporte

- Na stack de produção, somente Nginx publicará portas no host.
- HTTP servirá apenas redirecionamento para HTTPS.
- HTTPS aceitará TLS 1.2/1.3 com certificado e chave montados fora da imagem.
- API, MongoDB, Prometheus, Grafana e broker plaintext permanecerão somente na
  rede Docker.
- Acesso operacional a Grafana/Prometheus ocorrerá por túnel/rede administrativa
  ou por perfil explicitamente separado, nunca como default de produção.
- MQTT plaintext `1883` será interno. Um listener externo opcional usará
  MQTTS `8883`, certificado e ACL.
- O simulator terá apenas permissão de publish nos tópicos de sensores.
- A API terá apenas permissão de subscribe nesses tópicos.
- Socket.io externo usará WSS por meio do Nginx.

### 6. Configuração e secrets

- Um schema Joi validará configuração antes de conectar a dependências.
- `NODE_ENV=production` recusará:
  - CORS vazio ou wildcard;
  - segredo JWT ausente/fraco;
  - principals ausentes;
  - credenciais default;
  - TLS ausente;
  - MongoDB sem autenticação;
  - Swagger público sem opt-in explícito.
- Arquivos `_FILE` serão preferidos para secrets em produção.
- Logs deverão redigir senha, JWT, cookie, connection string e chaves.
- Swagger ficará desabilitado por default em produção.
- Métricas serão expostas somente à rede de observabilidade.

### 7. Validação e limites

- Joi validará todos os params, queries, bodies e payloads MQTT.
- Campos desconhecidos, operadores MongoDB e valores fora de allowlists serão
  rejeitados.
- Limites distintos serão aplicados a:
  - login: 5 tentativas por 15 minutos por IP e principal normalizado;
  - API autenticada: limite global existente, revisado para proxy confiável;
  - Socket.io: conexões e subscriptions por principal;
  - MQTT: tamanho de payload, frequência, metadata e timestamp.

### 8. Auditoria e pipeline

- Eventos de autenticação, autorização, rate limit, sessão e rejeição MQTT
  receberão correlation ID, sem incluir secrets.
- O CI terá gates para dependency audit, SAST, secret scanning, imagem, SBOM e
  DAST. Exceções exigirão registro com prazo e owner.
- GitHub Actions usarão permissões mínimas e referências imutáveis.

## Alternativas consideradas

### JWT persistido em `localStorage`

Rejeitado porque mantém o token disponível a qualquer JavaScript executado na
origem e prolonga a exposição em caso de XSS.

### JWT somente em cookie

Rejeitado para o access token porque exigiria proteção CSRF em toda operação de
estado e complicaria o uso compartilhado com Socket.io. O cookie fica restrito
ao refresh token.

### Sessão opaca para todas as requisições

Viável, mas rejeitada para preservar o contrato Bearer já adotado e manter
validação comum entre REST e Socket.io. O estado servidor fica limitado ao
refresh/revogação.

### Usuários completos no MongoDB

Rejeitado nesta entrega por expandir o domínio para cadastro, lifecycle de
contas e recuperação de senha. Principals montados como secret atendem ao case
fechado e aos dois papéis previstos.

### RS256

Rejeitado neste momento porque existe um único emissor/verificador. HS256 com
chave aleatória de 256 bits, rotação operacional e validação estrita é
suficiente para este limite de confiança. A migração para OIDC/RS256 exigirá
novo ADR.

### Manter portas administrativas publicadas

Rejeitado por ampliar desnecessariamente a superfície de ataque e permitir
bypass do Nginx.

## Consequências

### Positivas

- Tokens de longa duração deixam de ficar acessíveis ao JavaScript.
- Logout e replay de refresh passam a ter revogação efetiva.
- REST e Socket.io adotam autorização coerente.
- Produção falha fechado e reduz serviços publicamente alcançáveis.
- A arquitetura gera evidências objetivas para ASVS Level 2.

### Negativas

- A API passa a manter estado de refresh sessions no MongoDB.
- Deploy exige provisionamento de principals, JWT, TLS e credenciais.
- Ambientes sem HTTPS precisarão usar perfil de desenvolvimento explícito.
- Rotação de refresh e detecção de replay aumentam testes e complexidade.
- Acesso operacional a Grafana/Prometheus exige rede/túnel apropriado.

## Plano de migração

1. Criar testes que reproduzam defaults inseguros e acessos anônimos.
2. Adicionar config validada e suporte a secret files.
3. Implementar principals, access JWT e refresh sessions.
4. Migrar Dashboard para login explícito e token somente em memória.
5. Aplicar RBAC em REST e autenticação/autorização no Socket.io.
6. Validar MQTT e aplicar ACL.
7. Restringir portas e habilitar TLS no perfil de produção.
8. Adicionar auditoria, alertas e gates de CI.
9. Executar matrizes ASVS/OWASP e review.

## Gate de aprovação

Nenhum código da TASK-014 deve ser alterado até este ADR ser aceito.

- [ ] Estratégia de principals aprovada.
- [ ] Estratégia access/refresh token aprovada.
- [ ] RBAC `viewer`/`operator` aprovado.
- [ ] Isolamento de portas e TLS aprovado.
- [ ] Estratégia de secrets aprovada.
- [ ] ADR aceito por humano.

