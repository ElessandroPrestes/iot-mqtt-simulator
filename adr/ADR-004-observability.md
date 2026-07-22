# ADR-004: Monitoramento e Logs via Winston e Prometheus

**Status**: Aceito
**Data**: 2026-07-22

## Contexto
Observabilidade essencial para sistemas distribuídos e IoT para debugar mensagens perdidas e gargalos de processamento.

## Decisão
- Winston para estruturar logs como JSON para eventual coleta (ex: ELK/Datadog).
- Prom-client rodando na API (porta 9090) expondo métricas customizadas de MQTT recebido e performance HTTP, viabilizando monitoramento via Grafana/Prometheus.

## Consequências
- Adoção de padrão unificado que substitui console.log.
- Preparação out-of-the-box para alertas de infraestrutura através do Prometheus Manager.
