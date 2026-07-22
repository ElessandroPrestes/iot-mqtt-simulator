# Padrões de Banco de Dados

- Coleção `Reading`: Usar options `timeseries` nativas do Mongoose/MongoDB.
- TTL: Índice configurado para expirar documentos automaticamente (`expireAfterSeconds: 604800` = 7 dias) na coleção `Reading`.
- Índices adicionais para queries no `sensorId` e `timestamp`.
- Sem migrations manuais necessárias até o momento (Mongoose schema-syncing na inicialização em ambiente de Dev).
