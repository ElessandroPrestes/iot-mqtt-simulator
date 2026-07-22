# Log de Decisões (Decisions Log)

Este arquivo registra as decisões arquiteturais da Base de Conhecimento que não possuem um ADR formal, ou referenciam ADRs.

1. **Uso do MongoDB Timeseries**: Selecionado em vez de InfluxDB por simplificar a stack e unificar coleções no ecossistema já baseado em Node.js (Mongoose).
2. **WebSocket nativo vs MQTT via Web**: Escolhido Socket.io do backend em vez do Frontend conectar no MQTT broker via porta 9001, para que o Backend pudesse centralizar validações e persistência (Fonte de verdade única) antes de notificar clientes.
3. **Módulos ESM no Simulador**: Escolhido por modernidade, enquanto a API foi mantida em CommonJS para maior estabilidade com dependências antigas. (Requer uso de flag experimental no Jest).
