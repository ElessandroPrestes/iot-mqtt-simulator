# Padrões de Performance

- A persistência de banco de dados (`Reading`) usa a feature "Timeseries" do MongoDB para append rápido. Não usar coleções convencionais para leituras pontuais.
- Payload MQTT enxuto (evitar envio de metadados não utilizados) via QoS 1 (adequado para métricas industriais de baixo risco).
- API Node: Rotas com dados que não requerem tempo real estrito podem ser cacheadas (no futuro). O uso de compressão gzip (middleware `compression`) é obrigatório.
