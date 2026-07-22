# Perfil: Microservice IoT

Este projeto segue o perfil de Microserviços baseados em Eventos.

**Regras do Perfil:**
- Comunicação assíncrona preferencial via MQTT (`factory/sensors/#`).
- APIs REST são apenas para consultas (GET) ou ações síncronas que não se encaixam em fire-and-forget.
- WebSocket para eventos real-time no Dashboard.
- Persistência separada (MongoDB Timeseries para métricas).
- Cada microserviço (`api`, `simulator`, `dashboard`) tem seu próprio `package.json`, testes e Dockerfile multi-stage.
