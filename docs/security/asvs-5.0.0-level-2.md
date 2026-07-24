# Baseline OWASP ASVS 5.0.0 Level 2

**Status:** Review bloqueado — triagem por requisito e decisão arquitetural pendentes
**Data:** 2026-07-23
**Aprovação humana da baseline:** 2026-07-23
**Nível-alvo:** Level 2  
**Escopo:** API, Dashboard, Socket.io e controles de infraestrutura dependentes

## 1. Fonte canônica

- Versão estável: OWASP ASVS 5.0.0.
- Fonte:
  [CSV oficial](https://github.com/OWASP/ASVS/raw/v5.0.0/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv)
- SHA-256 do CSV avaliado:
  `98c8fe911b9edb403af8ee05d3ce8201ecac2659e313b053890a62847cdcf680`
- Requisitos totais no CSV: 345.
- Requisitos Level 1 ou Level 2: 253.

Os identificadores devem ser citados como `v5.0.0-<req_id>`. A baseline não é
certificação e não considera um requisito atendido sem evidência reproduzível.

## 2. Estados

| Estado | Significado |
|---|---|
| Pass | Controle implementado, testado e com evidência |
| Partial | Há controle, mas ele não cobre o requisito integralmente |
| Fail | Controle ausente ou comprovadamente inseguro |
| N/A | Requisito não se aplica, com justificativa |
| Pending | Ainda não triado por ID |

## 3. Inventário Level 1/2 por capítulo

| Capítulo | Tema | Qtde. L1/L2 | Aplicabilidade inicial | Baseline |
|---|---|---:|---|---|
| V1 | Encoding and Sanitization | 27 | Parcial: HTTP, MQTT, Mongo e logs | Fail |
| V2 | Validation and Business Logic | 11 | Sim | Fail |
| V3 | Web Frontend Security | 19 | Sim | Partial |
| V4 | API and Web Service | 10 | Sim: REST e WebSocket; GraphQL N/A | Fail |
| V5 | File Handling | 9 | Não há upload/download de arquivos | N/A preliminar |
| V6 | Authentication | 35 | Sim; funções de cadastro/change password parcialmente N/A | Fail |
| V7 | Session Management | 18 | Sim | Fail |
| V8 | Authorization | 7 | Sim | Fail |
| V9 | Self-contained Tokens | 7 | Sim: JWT | Fail |
| V10 | OAuth and OIDC | 29 | OAuth/OIDC não utilizados | N/A preliminar |
| V11 | Cryptography | 14 | Sim: JWT, refresh e secrets | Fail |
| V12 | Secure Communication | 9 | Sim: HTTPS/WSS/MQTT | Fail |
| V13 | Configuration | 13 | Sim | Fail |
| V14 | Data Protection | 9 | Sim | Fail |
| V15 | Secure Coding and Architecture | 13 | Sim | Partial |
| V16 | Security Logging and Error Handling | 16 | Sim | Fail |
| V17 | WebRTC | 7 | WebRTC não utilizado | N/A preliminar |
| **Total** |  | **253** |  |  |

## 4. Evidências atuais

### Controles parciais existentes

- Helmet na API.
- Rate limit HTTP global.
- Joi em parte das querystrings.
- JWT Bearer em rotas REST privadas.
- Error handler centralizado.
- CORS configurável.
- Mosquitto com `allow_anonymous false`.
- Logs Winston e métricas Prometheus.
- Lockfiles e `npm ci` no CI.

### Falhas comprovadas

- Credenciais e segredo JWT possuem fallback utilizável.
- Dashboard executa auto-login e persiste JWT em `localStorage`.
- JWT não fixa algoritmo, issuer e audience.
- Não há refresh rotation, revogação ou logout efetivo.
- Não há RBAC para resolução de alertas.
- Socket.io não autentica handshake/eventos.
- CORS falha para wildcard quando configuração está ausente.
- MQTT usa credencial compartilhada, sem ACL e sem validação integral do payload.
- Produção publica API, MQTT, Grafana e Prometheus diretamente.
- TLS não está configurado no Nginx/MQTT.
- MongoDB não exige autenticação no perfil de produção.
- Swagger e métricas não possuem política de exposição segura.
- Pipeline não possui SAST, secret scanning, image scan, SBOM ou DAST.
- Logging de segurança e alertas dedicados estão ausentes.

## 5. Baseline de dependências

Executado em 2026-07-23 com `npm audit --omit=dev --audit-level=high`:

| Serviço | High/Critical | Outros achados |
|---|---:|---|
| API | 0 | 1 moderate em `uuid`; correção sugerida é breaking |
| Dashboard | 0 | 2 moderate na cadeia `echarts`/`vue-echarts`; correção é breaking |
| Simulator | 0 | 0 |

Os achados moderate exigem triagem e testes de upgrade, mas não violam o gate
proposto de `high`/`critical`.

## 6. Triagem obrigatória antes da conclusão

A fase de implementação deve expandir esta baseline para uma linha por requisito
Level 1/2 contendo:

| Campo | Obrigatório |
|---|---|
| Requirement | ID no formato `v5.0.0-Vx.y.z` |
| Aplicável | Sim/Não |
| Estado | Pass/Fail/N/A |
| Justificativa | Motivo objetivo |
| Controle | Código/configuração responsável |
| Teste | Teste automatizado ou procedimento |
| Evidência | Commit, relatório ou saída reproduzível |
| Owner | Responsável pelo risco residual |

Requisitos N/A devem ser avaliados individualmente. A classificação preliminar
por capítulo não autoriza marcar automaticamente todos os IDs daquele capítulo.

## 7. Resultado do review de 2026-07-23

Os controles implementados passaram nas suítes da aplicação, no smoke test da
stack de produção, no Trivy e no ZAP. Isso não encerra o nível-alvo ASVS. Foram
identificados requisitos aplicáveis que conflitam com o ADR-006 ou ainda não
possuem evidência operacional:

| Requirement | Estado atual | Motivo |
|---|---|---|
| `v5.0.0-V12.3.1` | Fail | MQTT e MongoDB trafegam plaintext na rede Docker |
| `v5.0.0-V12.3.3` | Fail | Nginx, API e Dashboard usam HTTP interno |
| `v5.0.0-V13.2.1` | Fail | MongoDB e MQTT usam credenciais persistentes |
| `v5.0.0-V16.4.2` | Fail | Não há evidência de armazenamento imutável de logs |
| `v5.0.0-V16.4.3` | Fail | Logs não são enviados a sistema logicamente separado |

Esses itens não podem ser convertidos para `N/A` porque os fluxos existem e
estão no escopo. A correção exige nova decisão humana sobre arquitetura e
operação. O review completo está em
`reviews/REVIEW-TASK-014-owasp-security-hardening.md`.

## 8. Gates

- [x] Fonte estável e hash registrados.
- [x] Inventário Level 1/2 contado por capítulo.
- [x] Aplicabilidade inicial definida.
- [x] Falhas atuais documentadas.
- [ ] 253 requisitos triados individualmente.
- [ ] Todos os requisitos aplicáveis possuem evidência.
- [ ] Nenhum requisito aplicável permanece `Fail`.
- [ ] Exceções possuem aprovação, owner e prazo.
- [x] Baseline revisada por humano.
