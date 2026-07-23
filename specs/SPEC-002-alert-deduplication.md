# SPEC-002: Deduplicação de Alertas e Auto-Resolução

## 1. Objetivo
Evitar spam de alertas no banco de dados e na interface do usuário (Dashboard). A plataforma não deve criar um novo alerta para cada leitura fora do limiar se o sensor já se encontrar naquele estado de alerta. Além disso, o alerta deve ser encerrado (auto-resolvido) automaticamente assim que o sensor normalizar.

## 2. Escopo
- **Backend (`iot_api`)**:
  - Implementação de lógica de verificação de alertas ativos no `alertRepository.js`.
  - Orquestração de estado de alerta no `mqttService.js`.

## 3. Requisitos Funcionais

### 3.1. Deduplicação
- Quando o `mqttService` receber uma leitura com `status !== 'normal'`, o sistema deve verificar no banco (via `alertRepository`) se já existe um alerta **ativo** (`resolved: false`) para aquele `sensorId` e para o mesmo `level` (ex: `warning` ou `critical`).
- Se o alerta já existir, **nenhum novo alerta** deve ser criado, e nenhum evento WebSocket `alert:new` deve ser disparado.

### 3.2. Auto-Resolução
- Quando o `mqttService` receber uma leitura com `status === 'normal'`, o sistema deve verificar se existem alertas **ativos** para aquele `sensorId`.
- Caso existam, o sistema deve atualizá-los para `resolved: true` e preencher o campo `resolvedAt` com a data/hora da leitura de normalização.

## 4. Padrões de Aceite e Arquitetura
- A lógica de consulta ao Mongoose deve permanecer isolada no `alertRepository.js`. Devem ser criados métodos como `findActiveAlert(sensorId, level)` e `resolveActive(sensorId)`.
- O payload MQTT e a estrutura do banco (`Alert` Mongoose) não sofrem alterações na estrutura, apenas manipulação correta dos seus estados.
- Deverá haver testes unitários que garantam que um segundo alerta não é disparado consecutivamente.

## 5. Tasks Relacionadas
- [TASK-007-alert-deduplication.md](../tasks/TASK-007-alert-deduplication.md)
