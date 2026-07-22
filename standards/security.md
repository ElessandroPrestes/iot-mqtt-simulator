# Padrões de Segurança

- Dados sensíveis e URLs nunca devem estar hardcoded; sempre via `.env`.
- Uso mandatório de `helmet` e `express-rate-limit` (max 300 req/min) na API.
- Headers CORS restritos em ambiente de produção (definir via `CORS_ORIGINS`).
- Validação estrita de todos os payloads e querystrings usando o pacote `Joi` antes do roteamento na API.
