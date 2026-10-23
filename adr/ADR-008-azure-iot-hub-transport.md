# ADR-008: Integração opcional com Azure IoT Hub

## Metadados

| Campo | Valor |
|---|---|
| Status | Accepted (Aceito) |
| Data | 2026-10-23 |
| Responsáveis | Arquitetura e Engenharia |
| SPEC relacionada | SPEC-009 |
| Substitui/substituída por | N/A |

## Contexto

O produto opera exclusivamente em ambiente local. O caminho atual é
`Simulator -> Mosquitto -> API -> MongoDB/Socket.IO/Dashboard`, com tópicos
`factory/sensors/{type}/{sensorId}` e payload JSON validado pela API.

A integração com Azure IoT Hub é solicitada como capacidade opcional, sem
substituir o modo local. IoT Hub não é um broker MQTT genérico: dispositivos
publicam em `devices/{deviceId}/messages/events/`, o endpoint de consumo é
compatível com Event Hubs e a autenticação de dispositivo não aceita Microsoft
Entra ID. O nível gratuito tem limite de 8.000 mensagens por dia, 500
identidades e medição em blocos de 0,5 KB.

O código atual também possui limitações que precisam ser tratadas antes de
adicionar outro transporte:

- o simulador cria `2 x SIMULATOR_SENSORS_COUNT` sensores;
- o intervalo de publicação é criado dentro do evento `connect`, podendo
  duplicar após reconexão;
- não há encerramento controlado do simulador;
- o pipeline de negócio está acoplado ao `mqttService`;
- não há idempotência de leituras;
- o health check depende diretamente do MQTT;
- a redaction não cobre credenciais Azure.

## Drivers da decisão

- Preservar o modo local e o Mosquitto como caminho padrão.
- Não tratar IoT Hub como MQTT genérico nem tentar publicar tópicos
  `factory/...` diretamente no hub.
- Permitir demonstração com custo controlado no nível gratuito.
- Reutilizar o mesmo pipeline de classificação, persistência, alertas,
  WebSocket e métricas nos dois transportes.
- Evitar duplicidade de leituras e alertas em um transporte at-least-once.
- Não introduzir recursos pagos sem autorização explícita.
- Manter segredos fora do código, do Git e dos logs.
- Permitir rollback imediato para o modo local.

## Alternativas consideradas

### Alternativa A: substituir Mosquitto pelo IoT Hub

- Benefícios: um único transporte; menor código de seleção.
- Custos e riscos: quebra o modo local, exige conectividade e conta Azure para
  desenvolver, impõe tópicos fixos, adiciona custo e não atende ao requisito de
  operação local independente. Rejeitada.

### Alternativa B: bridge Mosquitto <-> IoT Hub

- Benefícios: mantém o simulador publicando em tópicos locais.
- Custos e riscos: adiciona um componente stateful, duplica autenticação e
  roteamento, precisa traduzir tópicos e payloads, e ainda assim não resolve
  idempotência nem observabilidade. Rejeitada para o primeiro incremento.

### Alternativa C: dois transportes selecionáveis no simulador e na API

- Benefícios: preserva o modo local; o simulador publica diretamente no IoT Hub
  quando configurado; a API consome o endpoint interno do hub; o pipeline é
  compartilhado; rollback é imediato.
- Custos e riscos: exige abstrações de publisher/ingress, configuração Azure,
  tratamento de idempotência e testes com mocks. É a alternativa escolhida.

### Alternativa D: serviço separado para consumir o IoT Hub

- Benefícios: isola o consumo Azure e permite escala independente.
- Custos e riscos: duplica o pipeline ou exige uma API interna, adiciona mais
  um processo para operar e observar, e aumenta o custo operacional da
  demonstração. Rejeitada para o primeiro incremento; pode ser reavaliada se o
  volume justificar.

## Decisão

Adotar a **Alternativa C**, com as seguintes decisões propostas, sujeitas à
aprovação humana da SPEC-009:

1. **Seleção de transporte**
   - `TELEMETRY_TRANSPORT=local|azure`, com padrão `local`.
   - Valor inválido ou ausente de configuração obrigatória no modo Azure deve
     falhar de forma explícita, sem fallback silencioso.

2. **Publisher do simulador**
   - Interface comum `publish(reading, context)` e `stop()`.
   - `LocalMqttPublisher` preserva tópicos, QoS 1 e payload atuais.
   - `AzureIotHubPublisher` usa `azure-iot-device` + `azure-iot-device-mqtt`,
     publica no tópico fixo do dispositivo e define `messageId`, `contentType`
     e `contentEncoding`.
   - O corpo da mensagem continua sendo o JSON de telemetria atual.

3. **Identidade do dispositivo**
   - Para o primeiro incremento, usar um único dispositivo gateway
     `simulator-gateway`.
   - O `sensorId` continua no payload; não criar um dispositivo por sensor nesta
     fase.
   - A alternativa de um dispositivo por sensor fica registrada para evolução
     futura.

4. **Ingress da API**
   - Interface comum `start(processor)` e `stop()`.
   - `localMqttIngress` encapsula o comportamento atual do MQTT.
   - `azureEventHubsIngress` usa `@azure/event-hubs` para consumir o endpoint
     interno `messages/events`.
   - O consumidor Azure executa dentro do processo da API no primeiro
     incremento, reutilizando o pipeline e o Socket.IO.
   - `@azure/event-hubs` usa AMQP; não há tentativa de consumir o endpoint
     interno via MQTT.

5. **Pipeline compartilhado**
   - Extrair `telemetryPayload` para validação/normalização independente de
     tópico.
   - Extrair `telemetryProcessor` para classificação, persistência, alertas,
     broadcast e métricas.
   - MQTT e Azure chamam o mesmo processor; nenhuma regra de negócio é
     duplicada.

6. **Entrega e idempotência**
   - O transporte é **at-least-once**, não exactly-once.
   - No Azure, cada mensagem publicada recebe `messageId` único; replay do mesmo
     evento mantém o mesmo `messageId`.
   - Criar coleção `ProcessedMessage` com `_id` determinístico e TTL de 7 dias.
   - Duplicata não cria nova `Reading`, não duplica alerta e não reemite
     `reading:new`.
   - No modo local, preservar o comportamento atual; a deduplicação local pode
     ser tratada em evolução separada.

7. **Checkpoint**
   - Não usar Blob Storage nem checkpoint store no primeiro incremento.
   - O consumidor inicia em `earliest`; após reinício, pode reprocessar eventos
     dentro da retenção.
   - A deduplicação durável cobre o replay.
   - Checkpoint com Blob só pode ser adicionado com autorização e orçamento
     explícitos.

8. **Alertas**
   - Adicionar índice único parcial em `Alert` para
     `{ sensorId, level }` quando `resolved: false`.
   - Migração deve tratar alertas ativos duplicados existentes antes de criar o
     índice.
   - A criação concorrente deve resultar em no máximo um alerta ativo por
     sensor e nível.

9. **Segurança**
   - Credenciais Azure somente por variável de ambiente ou `_FILE`.
   - X.509 é a opção preferida para dispositivo; connection string/SAS é
     permitida apenas para demonstração e deve ser carregada de secret file.
   - Connection strings, chaves SAS e certificados nunca podem aparecer em
     logs, testes, documentação ou commits.
   - Ampliar a redaction para `connectionString`, `SharedAccessKey`,
     `sasToken`, `AZURE_*` e equivalentes.

10. **Custo e capacidade**
    - O modo Azure deve recusar iniciar com configuração que exceda o orçamento
      diário gratuito, a menos que `AZURE_ALLOW_OVERAGE=true` seja definido
      explicitamente.
    - O perfil de demonstração deve usar poucos sensores e intervalo maior.
    - A documentação deve mostrar a conta de mensagens/dia e o efeito do bloco
      de 0,5 KB.

11. **Health e métricas**
    - O health deve refletir o transporte ativo.
    - Em `azure`, o MQTT deve aparecer como `disabled`, sem tornar a API
      `degraded`.
    - Preservar os campos atuais de MongoDB e MQTT para compatibilidade.
    - Métricas devem distinguir recebidas, processadas, rejeitadas, duplicadas,
      latência, reconexões e falhas por transporte.

12. **Semântica da contagem de sensores**
    - `SIMULATOR_SENSORS_COUNT` passa a representar o total de sensores, com
      padrão 8, distribuído deterministicamente entre os quatro tipos.
    - A correção é parte da SPEC-009 porque afeta custo, documentação e
      comportamento observável do modo local.
    - Se a aprovação não aceitar essa mudança, a implementação Azure fica
      bloqueada até uma decisão explícita.

## Consequências

### Positivas

- O modo local continua independente e é o padrão.
- O mesmo pipeline atende MQTT e Azure, reduzindo divergência de negócio.
- O consumo do endpoint interno não exige provisionar um Event Hubs separado.
- A deduplicação durável evita leituras e alertas duplicados em replay.
- O custo pode ser mantido dentro do nível gratuito com perfil adequado.
- O rollback para `local` é imediato.

### Negativas e riscos

- Há mais configuração e mais caminhos de teste.
- Sem checkpoint store, o reinício pode reprocessar eventos; a deduplicação é
  obrigatória.
- O modelo de gateway único não representa um dispositivo por sensor.
- O SDK Azure adiciona dependências e exige Node compatível.
- A cota gratuita é baixa para o volume padrão atual.
- A correção da contagem de sensores altera o comportamento local e exige
  comunicação no changelog.

## Implementação e migração

- **Compatibilidade:** o modo local permanece padrão; contratos REST,
  WebSocket, payload e tópicos locais não mudam. O health ganha campos
  aditivos.
- **Etapas:** criar artefatos SDD; implementar publisher e ciclo de vida;
  extrair pipeline e idempotência; implementar ingress Azure; adicionar testes,
  Docker opcional e documentação; validar custo e rollback.
- **Rollback:** definir `TELEMETRY_TRANSPORT=local` (ou remover a configuração
  Azure), reiniciar os serviços e manter o Mosquitto. Nenhuma migração
  destrutiva de `Reading` é executada.
- **Observabilidade:** logs estruturados sem segredos; métricas por transporte;
  health com status do ingress ativo; alerta operacional para falhas de
  conexão e para aproximação da cota.

## Evidências e validação

- Testes automatizados locais para publisher, lifecycle, pipeline,
  idempotência, alertas, health e redaction.
- Teste de regressão completo do modo local.
- Teste real no Azure somente com autorização, credenciais explícitas e
  `AZURE_IOT_REAL_TESTS=1`.
- Relatório de custo com mensagens/dia e comparação com o nível gratuito.
- Revisão de segurança para segredos, logs e permissões.
