# SPEC-009: Integração opcional com Azure IoT Hub

## Metadados

| Campo | Valor |
|---|---|
| ID | SPEC-009 |
| Status | Approved (Aprovado) |
| Responsável | Arquitetura e Engenharia |
| Revisores | Produto / Engenharia / QA / Segurança |
| Criado | 2026-10-23 |
| Atualizado | 2026-10-23 |
| Liberação Alvo | Incremento local, sem release público |
| Refs: | Discovery: `doc-iot.md`; Design: N/A — sem alteração de interface; ADRs: `adr/ADR-008-azure-iot-hub-transport.md` |

> Esta SPEC está em rascunho. Nenhuma TASK pode ser executada antes da
> aprovação humana e da conversão das TASKs para `Ready`.

## Problema e resultado

O projeto só publica e consome telemetria pelo Mosquitto local. O pedido é
adicionar Azure IoT Hub como transporte opcional, sem substituir o modo local,
sem tratar o hub como broker MQTT genérico e sem gerar custo não autorizado.

O código atual tem bloqueios que precisam ser resolvidos no mesmo incremento:

- o simulador cria o dobro de sensores documentado;
- o intervalo de publicação pode ser duplicado em reconexões;
- o pipeline de negócio está acoplado ao MQTT;
- não há idempotência de leituras;
- o health depende diretamente do MQTT;
- a redaction não cobre credenciais Azure.

Resultado desejado: um operador consegue iniciar o produto no modo local
(padrão) ou no modo Azure, com o mesmo pipeline de negócio, custo controlado,
segredos protegidos e rollback imediato para o modo local.

Medidas de sucesso:

- modo local com regressão funcional completa;
- modo Azure validado com mocks e, se autorizado, com um hub real;
- nenhuma leitura ou alerta duplicado em replay;
- consumo diário estimado dentro do orçamento configurado;
- nenhum segredo em logs, testes ou repositório.

## Escopo

### No escopo

- Seleção `TELEMETRY_TRANSPORT=local|azure`, com padrão `local`.
- Abstração de publisher no simulador.
- Publisher Azure IoT Hub via SDK de dispositivo.
- Abstração de ingress na API.
- Consumidor do endpoint interno do IoT Hub via `@azure/event-hubs`.
- Extração de `telemetryPayload` e `telemetryProcessor`.
- Idempotência durável de mensagens Azure.
- Índice único parcial para alertas ativos.
- Health e métricas cientes do transporte.
- Guarda de custo e perfil econômico.
- Configuração por ambiente/`_FILE`, redaction e documentação.
- Testes automatizados, Docker opcional e rollback.
- Correção da semântica de `SIMULATOR_SENSORS_COUNT`.

### Fora do escopo

- Substituir ou remover Mosquitto.
- Provisionar IoT Hub, Blob Storage, Event Hubs ou qualquer recurso Azure.
- Usar Microsoft Entra ID para autenticação de dispositivo.
- Um dispositivo IoT Hub por sensor nesta fase.
- Checkpoint store com Blob Storage.
- Exactly-once.
- Alterar dashboard, contratos REST existentes, payload ou tópicos locais.
- Rotação automatizada de certificados X.509.
- Deploy remoto, tag, release público ou merge em `main`.
- Teste real no Azure sem autorização explícita.

## Comportamento funcional

### Seleção de transporte

- `TELEMETRY_TRANSPORT` ausente ou `local` mantém o comportamento atual.
- `azure` ativa o publisher Azure no simulador e o ingress Azure na API.
- Qualquer outro valor falha na inicialização com mensagem clara.
- No modo Azure, a API não abre conexão MQTT e o simulador não publica no
  Mosquitto.
- No modo local, nenhum SDK Azure é inicializado e nenhuma credencial Azure é
  exigida.

### Simulador

- `SIMULATOR_SENSORS_COUNT` representa o total de sensores, com padrão 8.
- A distribuição entre os quatro tipos é determinística: os sensores são
  criados em ordem de tipo e numerados sequencialmente.
- O simulador mantém um único intervalo de publicação durante todo o ciclo de
  vida, inclusive após reconexão.
- `SIGTERM` e `SIGINT` param o intervalo, encerram o publisher e finalizam o
  processo.
- `stop()` é idempotente.
- O modo local preserva tópicos, QoS 1 e payload atuais.
- O modo Azure publica no tópico fixo do dispositivo
  `devices/{deviceId}/messages/events/`, com corpo JSON igual ao payload atual.
- Cada mensagem Azure recebe `messageId` único, `contentType`
  `application/json` e `contentEncoding` `utf-8`.
- Falhas de publicação são registradas sem segredo, com retry limitado e
  backoff; falha permanente não derruba o processo sem log.

### API e pipeline

- `telemetryPayload` valida o JSON e normaliza os campos sem depender do tópico.
- `telemetryProcessor` executa classificação, persistência, alertas, broadcast
  e métricas.
- O ingress local e o ingress Azure chamam o mesmo processor.
- O ingress Azure consome o endpoint interno `messages/events` com
  `EventHubConsumerClient`, grupo `$Default` por padrão, `startPosition:
  earliest`, lote limitado e sem checkpoint store.
- O ingress Azure inicia somente no modo Azure e falha de forma explícita se a
  connection string ou o nome do event hub estiverem ausentes.
- O encerramento da API fecha o ingress ativo e o MongoDB de forma controlada.

### Idempotência

- No Azure, `messageId` é obrigatório. Mensagem sem `messageId` é rejeitada.
- `ProcessedMessage` usa `_id` determinístico derivado de
  `transport:messageId`.
- O processamento faz claim atômico com lease; mensagem já concluída é
  duplicata e não gera nova `Reading`, novo alerta ou novo `reading:new`.
- Claim expirado pode ser retomado; falha capturada libera o claim para retry.
- `ProcessedMessage` tem TTL de 7 dias, superior à retenção de 1 dia do
  endpoint interno.
- O modo local preserva o comportamento atual; deduplicação local fica fora
  desta SPEC.

### Alertas

- Um alerta ativo é único por `sensorId + level`.
- A criação usa operação atômica compatível com o índice único parcial.
- Concorrência resulta em no máximo um alerta ativo; o perdedor não emite
  `alert:new`.
- Auto-resolução continua funcionando e libera o índice.
- Migração trata alertas ativos duplicados existentes antes de criar o índice.

### Health e métricas

- `GET /health` e `GET /api/v1/health` continuam retornando o envelope atual.
- O payload ganha `transport` e `services.azureEventHubs` de forma aditiva.
- No modo local, `services.azureEventHubs.status` é `disabled`.
- No modo Azure, `services.mqtt.status` é `disabled` e não torna a API
  `degraded`.
- A API é saudável quando MongoDB e o ingress ativo estão conectados.
- Métricas distinguem mensagens recebidas, processadas, rejeitadas, duplicadas,
  latência, reconexões e falhas por transporte.
- Logs não incluem connection string, chave SAS, certificado ou token.

### Custo

- O modo Azure calcula `mensagens/dia = sensores x (86400000 / intervalo)`.
- O cálculo considera `ceil(bytes / 512)` por mensagem.
- Se o total exceder `AZURE_DAILY_MESSAGE_BUDGET` (padrão 8000) e
  `AZURE_ALLOW_OVERAGE` não for `true`, a inicialização falha com orientação.
- O perfil documentado para demonstração deve caber no orçamento.
- O modo local não sofre guarda de custo.

### Segurança

- Credenciais Azure vêm de variável de ambiente ou `_FILE`.
- X.509 é a opção preferida para dispositivo.
- Connection string/SAS é permitida apenas para demonstração e deve vir de
  secret file.
- `.env.example` contém apenas placeholders.
- Redaction cobre `connectionString`, `SharedAccessKey`, `sasToken`,
  `AZURE_*` e campos equivalentes.
- Nenhum segredo é impresso em log, teste, documentação ou commit.

## Requisitos não-funcionais

- **Segurança e privacidade:** TLS em todos os transportes; menor privilégio;
  segredos fora do repositório; redaction obrigatória; nenhuma credencial em
  mensagem de erro.
- **Desempenho e capacidade:** processamento por lote limitado; sem crescimento
  ilimitado de memória; guarda de custo antes de iniciar o modo Azure.
- **Confiabilidade e recuperação:** at-least-once; deduplicação durável;
  reconexão com backoff; encerramento controlado; claim com lease.
- **Acessibilidade:** N/A — sem alteração de interface.
- **Compatibilidade:** Node.js 22 no CI/Docker; modo local e contratos atuais
  preservados; health apenas aditivo.
- **Observabilidade:** logs estruturados, métricas por transporte e health com
  status do ingress ativo.

## Critérios de aceitação

### AC-001

```yaml
id: AC-001
title: Modo local permanece o padrão e funcional
preconditions:
  - TELEMETRY_TRANSPORT ausente ou local
action: Iniciar simulador, Mosquitto, API e dashboard; publicar telemetria
expected_result: Tópicos, payload, QoS 1, pipeline, alertas, WebSocket e dashboard funcionam como antes
evidence_type: automated
```

### AC-002

```yaml
id: AC-002
title: Contagem de sensores representa o total
preconditions:
  - SIMULATOR_SENSORS_COUNT=8
action: Iniciar o simulador e inspecionar os sensores criados
expected_result: Exatamente 8 sensores são criados, distribuídos deterministicamente entre os quatro tipos
evidence_type: automated
```

### AC-003

```yaml
id: AC-003
title: Publisher é selecionado por transporte
preconditions:
  - Configuração local e Azure disponíveis
action: Iniciar o simulador com TELEMETRY_TRANSPORT=local e depois azure
expected_result: O publisher correspondente é usado; o modo local não inicializa SDK Azure e o modo Azure não publica no Mosquitto
evidence_type: automated
```

### AC-004

```yaml
id: AC-004
title: Publicação Azure usa contrato do IoT Hub
preconditions:
  - TELEMETRY_TRANSPORT=azure e dispositivo configurado
action: Publicar uma leitura
expected_result: Mensagem usa o tópico fixo do dispositivo, corpo JSON atual, messageId único, contentType e contentEncoding; nenhum tópico factory é enviado ao hub
evidence_type: automated
```

### AC-005

```yaml
id: AC-005
title: Ciclo de vida do simulador não duplica intervalos
preconditions:
  - Simulador conectado e reconectando
action: Simular reconexões e enviar SIGTERM
expected_result: Existe no máximo um intervalo ativo; stop é idempotente; publisher e processo encerram sem novas publicações
evidence_type: automated
```

### AC-006

```yaml
id: AC-006
title: Pipeline de telemetria é compartilhado
preconditions:
  - Ingress local e Azure disponíveis
action: Processar a mesma leitura pelos dois ingress
expected_result: Ambos usam telemetryProcessor e produzem o mesmo resultado de classificação, persistência, alerta e broadcast, sem lógica duplicada
evidence_type: automated
```

### AC-007

```yaml
id: AC-007
title: Ingress Azure consome o endpoint interno
preconditions:
  - TELEMETRY_TRANSPORT=azure e EventHubConsumerClient configurado
action: Iniciar a API e entregar um evento do endpoint messages/events
expected_result: O evento é consumido via Event Hubs, processado pelo pipeline e a API não abre conexão MQTT
evidence_type: automated
```

### AC-008

```yaml
id: AC-008
title: Replay Azure não duplica leitura
preconditions:
  - Mensagem Azure com messageId já processado
action: Reentregar o mesmo evento
expected_result: Nenhuma nova Reading é criada, nenhum alerta é duplicado e nenhum reading:new é reemitido
evidence_type: automated
```

### AC-009

```yaml
id: AC-009
title: Alerta ativo é único sob concorrência
preconditions:
  - Índice único parcial aplicado e sem duplicados ativos
action: Processar duas mensagens concorrentes que geram o mesmo sensorId e level
expected_result: No máximo um alerta ativo é criado e apenas um alert:new é emitido
evidence_type: automated
```

### AC-010

```yaml
id: AC-010
title: Health reflete o transporte ativo
preconditions:
  - API em modo local e em modo Azure
action: Consultar /health e /api/v1/health
expected_result: O payload mantém os campos atuais, adiciona transport e azureEventHubs, e não fica degraded por MQTT disabled no modo Azure
evidence_type: automated
```

### AC-011

```yaml
id: AC-011
title: Segredos Azure não vazam
preconditions:
  - Connection string, chave SAS e certificado configurados em secret files
action: Iniciar serviços, provocar erros e inspecionar logs, testes e diff
expected_result: Nenhum segredo aparece em log, teste, documentação ou repositório; redaction cobre os campos Azure
evidence_type: security
```

### AC-012

```yaml
id: AC-012
title: Guarda de custo impede excesso não autorizado
preconditions:
  - TELEMETRY_TRANSPORT=azure e perfil acima do orçamento
action: Iniciar o simulador sem AZURE_ALLOW_OVERAGE=true
expected_result: A inicialização falha com mensagem clara e a conta de mensagens/dia; com autorização explícita, inicia e registra aviso
evidence_type: automated
```

### AC-013

```yaml
id: AC-013
title: Docker e documentação preservam o modo local
preconditions:
  - Compose local e overlay Azure documentado
action: Subir o modo local, alternar para Azure e voltar para local
expected_result: O compose local continua funcionando; o overlay Azure é opcional; o rollback para local é documentado e reproduzível
evidence_type: manual
```

### AC-014

```yaml
id: AC-014
title: Regressão e evidências completas
preconditions:
  - Implementação das TASKs concluída
action: Executar testes do simulador, API e dashboard e revisar evidências
expected_result: Todos os testes existentes e novos passam; cada AC tem evidência automatizada ou manual registrada
evidence_type: automated
```

### AC-015

```yaml
id: AC-015
title: Nenhuma expansão de escopo
preconditions:
  - Diff final da implementação
action: Revisar arquivos e contratos alterados
expected_result: Dashboard, tópicos locais, payload, schema timeseries de Reading e rotas REST existentes não foram alterados; health é apenas aditivo
evidence_type: manual
```

## Abordagem técnica

### Configuração

Novas variáveis, todas validadas por modo:

| Variável | Obrigatória | Padrão | Uso |
|---|---|---|---|
| `TELEMETRY_TRANSPORT` | Não | `local` | Seleciona `local` ou `azure` |
| `AZURE_IOT_HUB_DEVICE_CONNECTION_STRING` | Azure | — | Autenticação do dispositivo; aceita `_FILE` |
| `AZURE_IOT_HUB_DEVICE_ID` | Azure | `simulator-gateway` | Identidade do gateway |
| `AZURE_EVENT_HUB_CONNECTION_STRING` | Azure | — | Endpoint interno; aceita `_FILE` |
| `AZURE_EVENT_HUB_NAME` | Azure | — | Nome/EntityPath do endpoint interno |
| `AZURE_EVENT_HUB_CONSUMER_GROUP` | Não | `$Default` | Grupo de consumidores |
| `AZURE_DAILY_MESSAGE_BUDGET` | Não | `8000` | Orçamento diário |
| `AZURE_ALLOW_OVERAGE` | Não | `false` | Autoriza exceder o orçamento |
| `AZURE_IOT_REAL_TESTS` | Não | `false` | Habilita teste real opt-in |

### Componentes

- `services/simulator/src/publishers/localMqttPublisher.js`
- `services/simulator/src/publishers/azureIotHubPublisher.js`
- `services/simulator/src/sensors/factory.js`
- `services/simulator/src/lifecycle.js` ou equivalente
- `services/api/src/services/telemetryPayload.js`
- `services/api/src/services/telemetryProcessor.js`
- `services/api/src/ingress/localMqttIngress.js`
- `services/api/src/ingress/azureEventHubsIngress.js`
- `services/api/src/models/ProcessedMessage.js`
- `services/api/src/repositories/processedMessageRepository.js`
- `services/api/src/config/azure.js`
- `services/api/src/routes/health.js`
- `services/api/src/services/metricsService.js`
- `services/api/src/utils/redact.js`

### Dependências

- `azure-iot-device@1.18.4`
- `azure-iot-device-mqtt@1.16.4`
- `@azure/event-hubs@6.0.4`

Não adicionar `@azure/identity` nesta fase, pois o endpoint interno usa SAS e a
autenticação de dispositivo não aceita Entra ID. Reavaliar somente se houver
uma decisão arquitetural específica.

### Migração

- Criar `ProcessedMessage` e seus índices de forma aditiva.
- Criar índice único parcial em `Alert` após migração de duplicados ativos.
- Não alterar o schema timeseries de `Reading`.
- Não migrar dados históricos de leitura.
- O script de migração deve ser idempotente e registrar quantos alertas foram
  resolvidos.

### Alternativas rejeitadas

- Substituir Mosquitto pelo IoT Hub.
- Bridge Mosquitto <-> IoT Hub.
- Consumidor Azure em serviço separado no primeiro incremento.
- Checkpoint com Blob Storage no primeiro incremento.
- Exactly-once.
- Publicar tópicos `factory/...` no IoT Hub.

## Entrega e operações

- **Plano de implantação:** incremento local na branch `develop`; modo Azure
  opt-in; nenhum recurso Azure provisionado por esta SPEC.
- **Plano de migração:** script idempotente para duplicados de alerta; coleção
  `ProcessedMessage` aditiva.
- **Plano de rollback:** `TELEMETRY_TRANSPORT=local`, reiniciar serviços e
  manter Mosquitto; reverter o commit se necessário.
- **Monitoramento e alertas:** health por transporte, métricas de recebimento,
  processamento, rejeição, duplicidade, latência, reconexão e falha; aviso de
  aproximação do orçamento diário.

## Riscos e dependências

| Risco ou dependência | Impacto | Probabilidade | Mitigação | Responsável |
|---|---|---|---|---|
| Cota gratuita estourada pelo perfil padrão | Custo e indisponibilidade | Alta | Guarda de custo, perfil econômico e documentação | Engenharia |
| Replay duplicar leituras/alertas | Dados incorretos | Alta | `ProcessedMessage` com claim/lease e testes de replay | Engenharia |
| Corrida na criação de alertas | Alertas duplicados | Média | Índice único parcial e operação atômica | Engenharia |
| Connection string em log | Vazamento de credencial | Média | `_FILE`, redaction e revisão de segurança | Segurança |
| Health degraded no modo Azure | Falso negativo operacional | Média | Health ciente do transporte ativo | Engenharia |
| Reconexão duplicar intervalos | Volume e custo duplicados | Média | Ciclo de vida único e testes de reconexão | Engenharia |
| SDK Azure incompatível com Node | Falha de build/runtime | Baixa | Fixar versões, Node 22 no CI e testes | Engenharia |
| Sem checkpoint, replay após reinício | Reprocessamento | Média | Deduplicação durável e documentação de at-least-once | Engenharia |
| Correção da contagem de sensores alterar o modo local | Mudança observável | Média | Aprovação explícita, changelog e testes de regressão | Produto |
| Dependência de conta/assinatura Azure | Bloqueio de validação real | Média | Testes com mocks; teste real opt-in e autorizado | Produto |

## Questões abertas

| Questão | Responsável | Data limite | Resolução |
|---|---|---|---|
| Gateway único `simulator-gateway` ou um dispositivo por sensor? | Responsável do projeto | Antes da implementação | Resolvido: gateway único |
| Consumidor embutido na API ou serviço separado? | Responsável do projeto | Antes da implementação | Resolvido: consumidor embutido |
| Sem Blob Storage/checkpoint no primeiro incremento? | Responsável do projeto | Antes da implementação | Resolvido: sem Blob; deduplicação durável |
| Corrigir `SIMULATOR_SENSORS_COUNT` para total de 8? | Responsável do projeto | Antes da implementação | Resolvido: corrigir para total de 8 |
| X.509 ou connection string/SAS para a demonstração? | Responsável do projeto | Antes da implementação | Resolvido: X.509; SAS apenas demo |
| Formato aditivo do health é aceitável? | Responsável do projeto | Antes da implementação | Resolvido: sim |

## Aprovação

| Papel | Nome | Decisão | Data | Notas |
|---|---|---|---|---|
| Produto | Responsável do projeto | Approved | 2026-10-23 | Aprovação explícita no chat, com as recomendações do ADR-008 |
| Design | N/A | N/A | 2026-10-23 | Sem alteração de interface |
| Engenharia | Arquitetura e Engenharia | Approved | 2026-10-23 | Escopo e decisões aprovados |
| QA | Engenharia | Ready | 2026-10-23 | QA-009 em execução por tarefa |
