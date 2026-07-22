# ADR-002: Persistência de Dados em MongoDB Timeseries

**Status**: Aceito
**Data**: 2026-07-22

## Contexto
Leituras de sensores são massivas e append-only, necessitando rápida escrita, recuperação eficiente baseada no tempo e eventual expiração de dados antigos.

## Decisão
Usar MongoDB (v7+) com collections configuradas explicitamente como `timeseries` para a entidade `Reading`, aplicando um TTL de 7 dias (604800s).

## Consequências
- Não usar bancos dedicados SQL (ex: TimescaleDB) ou NoSQL puramente timeseries (InfluxDB) reduziu a complexidade mantendo todo o backend unificado via Mongoose/Node.js.
- Otimização automática de disco pela engine do MongoDB.
