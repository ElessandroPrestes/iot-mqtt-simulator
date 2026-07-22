# Padrões de API

- Versionamento via path (`/api/v1/`).
- Responses sempre retornam JSON em objetos nomeados: `{"data": [...], "pagination": {...}}` ou `{"error": "message"}`.
- Tratamento global de erros para capturar falhas em promises.
- Métricas expostas via rota exclusiva `/metrics` para consumo do Prometheus.
