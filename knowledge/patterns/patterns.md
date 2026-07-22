# Padrões do Projeto

## Eventos em Tempo Real
Sempre que uma mensagem MQTT chega, o fluxo é:
1. Recebida pela API (`mqttService.js`).
2. Persistida no MongoDB (Collection Timeseries).
3. Classificada em relação aos thresholds (normal, warning, critical).
4. Se houver alerta, criado em collection `Alerts` e emitido evento via WebSocket `alert:new`.
5. Emitido evento via WebSocket `reading:new`.
6. Vue.js escuta WebSockets na store de `connection` ou `sensors` e atualiza a UI de forma reativa.

## Separação de Rotas API
A API Express separa rotas no diretório `routes/`, com lógicas complexas delegadas a `services/`.
Validações de entrada são feitas por middleware com pacote Joi.
