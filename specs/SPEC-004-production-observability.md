# SPEC-004: Observabilidade e Produção (Grafana e Proxy)

## 1. Objetivo
Estabilizar a infraestrutura para implantação de produção ("production-like"), introduzindo um Proxy Reverso e um sistema unificado de Observabilidade.

## 2. Escopo
- **Infraestrutura**: Adição do Nginx e Grafana ao arquivo `docker-compose.prod.yml`. (O Prometheus já possui endpoint gerado pela aplicação na porta 9090, mas falta o Grafana para UI).
- **Backend**: Adaptações de headers para lidar com proxy.

## 3. Requisitos Funcionais

### 3.1. Proxy Reverso (Nginx)
- O tráfego não deve mais ir diretamente à API (porta 3000) e ao Frontend (porta 5173).
- O Nginx escutará na porta 80 e encaminhará os requests para:
  - `/api/` -> `http://api:3000/api/`
  - `/socket.io/` -> `http://api:3000/socket.io/` (com suporte a WebSockets/Upgrade)
  - `/` -> Arquivos estáticos gerados pelo build do Vue (Dashboard).
- Aplicar headers de segurança (ex: X-Frame-Options) e limite de requisições (rate limiting).

### 3.2. Dashboards de Observabilidade (Grafana)
- O Grafana deve ser provisionado automaticamente sem necessidade de cliques na UI (Config as Code).
- O datasource do Prometheus deve ser conectado por default via `provisioning/datasources`.
- Um dashboard em formato `.json` ("IoT Overview") deve ser carregado por default em `provisioning/dashboards`, contendo visualizações para as métricas da API: `mqtt_messages_total`, `sensor_value`, e `http_request_duration_seconds`.

## 4. Padrões de Aceite e Arquitetura
- Todo o setup deve subir perfeitamente com um único comando `docker compose -f docker-compose.prod.yml up -d`.
- A porta 80 do localhost deve expor toda a aplicação.

## 5. Tasks Relacionadas
- [TASK-009-nginx-reverse-proxy.md](../tasks/TASK-009-nginx-reverse-proxy.md)
- [TASK-010-grafana-dashboard.md](../tasks/TASK-010-grafana-dashboard.md)
