# TASK-010: Grafana Dashboard de Observabilidade

## Fase
**4 — Observabilidade Avançada**

## Prioridade
**P2 — Média**

## Contexto
O Prometheus já está configurado na API (`metricsService.js`, porta 9090). Falta a camada de visualização com Grafana e o provisionamento automático no Docker Compose.

## Escopo
- `infrastructure/grafana/` (NOVO)
- `docker-compose.yml` — adicionar serviço Grafana

## Métricas Disponíveis (já expostas pela API)
| Métrica | Tipo | Labels |
|---|---|---|
| `mqtt_messages_total` | Counter | `topic`, `sensor_type` |
| `sensor_value` | Gauge | `sensor_id`, `sensor_type`, `unit` |
| `alerts_total` | Counter | `level`, `sensor_type` |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` |
| Métricas Node.js padrão | — | process, memory, event loop |

## O que Fazer

### 1. Estrutura de Arquivos
```
infrastructure/grafana/
├── provisioning/
│   ├── datasources/
│   │   └── prometheus.yml   # Datasource automático
│   └── dashboards/
│       ├── dashboard.yml    # Configuração de provisionamento
│       └── iot-overview.json # Dashboard pré-configurado
```

### 2. `provisioning/datasources/prometheus.yml`
```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://api:9090
    isDefault: true
    access: proxy
```

### 3. Dashboard `iot-overview.json` — Painéis
- **Taxa de Mensagens MQTT** — gráfico de linha por `sensor_type`
- **Valores por Sensor** — gauge por `sensor_id` com thresholds (normal/warning/critical)
- **Alertas por Nível** — stat com total de warning vs critical
- **Latência HTTP** — heatmap de `http_request_duration_seconds`
- **Saúde do Sistema** — CPU, memória, event loop lag do Node.js

### 4. `docker-compose.yml` — Adicionar Grafana
```yaml
grafana:
  image: grafana/grafana:10.4.0
  ports:
    - "3001:3000"
  volumes:
    - ./infrastructure/grafana/provisioning:/etc/grafana/provisioning
    - grafana_data:/var/lib/grafana
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
    - GF_USERS_ALLOW_SIGN_UP=false
  depends_on:
    - api
```

## Critério de Aceite
- [ ] Grafana acessível em `http://localhost:3001`
- [ ] Datasource Prometheus provisionado automaticamente
- [ ] Dashboard carregado automaticamente com dados ao vivo
- [ ] Todos os 5 tipos de painel funcionando
- [ ] Login: admin/admin

## Status
🔴 **Aberto**
