# Visão Geral da Arquitetura

O sistema é um IoT MQTT Simulator composto por:
- **Simulator**: Gera dados mockados de sensores industriais e publica em tópicos MQTT.
- **Broker MQTT**: Eclipse Mosquitto gerencia as mensagens.
- **API**: Node.js com Express e Socket.io, que assina tópicos MQTT, salva no MongoDB Timeseries, expõe API REST e emite eventos WebSocket.
- **MongoDB**: Armazena as leituras no formato Timeseries com TTL de 7 dias e Alertas.
- **Dashboard**: Frontend Vue.js 3 que exibe dados via API e WebSocket.

**Princípios Arquiteturais:**
1. Event-Driven: Componentes se comunicam via broker MQTT de forma assíncrona.
2. Microservices: Cada componente roda em seu container Docker e pode ser escalado independentemente.
3. Real-time: Atualizações de UI são feitas via WebSocket (`socket.io`).
