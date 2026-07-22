# ADR-001: Arquitetura de Microserviços baseada em Eventos

**Status**: Aceito
**Data**: 2026-07-22

## Contexto
O simulador de IoT requer geração, processamento e visualização de dados de múltiplos sensores industriais em alta frequência, escalável para milhares de sensores.

## Decisão
Adoção de microserviços em containers Docker. Comunicação primária assíncrona usando MQTT (broker Mosquitto) entre Simulator e API. Comunicação síncrona/WebSockets entre API e Dashboard Vue.js.

## Consequências
- Escalonabilidade independente de geradores e consumidores.
- Maior complexidade na orquestração (via docker-compose).
- Desacoplamento através de Event-Driven Architecture.
