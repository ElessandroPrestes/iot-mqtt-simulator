# Integração MQTT

O sistema utiliza MQTT v5.

## Broker
- **Host**: `broker` (porta 1883 no Docker, 9001 para WebSockets)
- **Auth**: Requer usuário (`MQTT_USERNAME`) e senha (`MQTT_PASSWORD`).

## Tópicos
Padrão: `factory/sensors/<type>/<sensorId>`
- `factory/sensors/temperature/+`
- `factory/sensors/pressure/+`
- `factory/sensors/humidity/+`
- `factory/sensors/vibration/+`

## Publishers e Subscribers
- **Simulator (Publisher)**: Publica mensagens a cada `SIMULATOR_INTERVAL_MS`.
- **API (Subscriber)**: Assina todos os tópicos `factory/sensors/#` e processa mensagens.
