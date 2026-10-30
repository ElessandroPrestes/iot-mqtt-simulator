# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o
projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- Snapshot pré-1.0 do Universal SDD Framework, atualizado em 2026-10-23.
- `ROADMAP.md` com o estado de adoção do framework e a evolução planejada.
- `CODE_OF_CONDUCT.md` com as regras de convivência do projeto.
- `knowledge/INDEX.md` com o índice de recuperação seletiva da Base de Conhecimento.
- Seções de UX/UI, design system, acessibilidade e quality gates no `PROJECT.md`.
- Seleção `TELEMETRY_TRANSPORT` no simulador, com modo `local` como padrão.
- Abstração de publisher e `LocalMqttPublisher` no simulador.
- Fábrica determinística de sensores e lifecycle de publicação testável.
- `AzureIotHubPublisher` opcional com connection string/SAS, `messageId`,
  content type/encoding e propriedades de roteamento.
- Guarda de custo `AZURE_DAILY_MESSAGE_BUDGET` / `AZURE_ALLOW_OVERAGE`.
- Redaction de segredos nos loggers do simulador e da API.
- Pipeline compartilhado `telemetryPayload`/`telemetryProcessor` na API.
- Deduplicação durável de mensagens Azure em `ProcessedMessage`.
- Índice único parcial de alertas ativos e migração idempotente de duplicados.
- Ingress Azure Event Hubs na API, com seleção por `TELEMETRY_TRANSPORT`.
- Health aditivo por transporte e métricas de recebimento, rejeição, latência,
  reconexão e falha do ingress.
- Overlay `docker-compose.azure.yml` opcional, sem alterar o compose local.

### Changed

- `UNIVERSAL_SDD_FRAMEWORK.md` alinhado à estrutura, princípios e documentação do
  snapshot pré-1.0.
- `README.md` atualizado com o índice da documentação do framework.
- Matriz de rastreabilidade regenerada a partir dos artefatos reais do repositório.
- Informações de riscos e limitações reclassificadas no `PROJECT.md`.
- Gerador de rastreabilidade compatível com `TASK-NNN` histórico e
  `TASK-NNN-XX` canônico.

### Fixed

- `make build` e `make up` deixam de falhar por ausência de
  `GF_SECURITY_ADMIN_PASSWORD` e `JWT_SECRET`: o novo `make dev-env` gera os
  segredos locais ausentes de forma idempotente, mantendo a interpolação
  obrigatória do compose e sem valores padrão conhecidos.

### Security

- Dependências de produção da API e do Dashboard atualizadas para corrigir
  advisories HIGH/CRITICAL publicados após o último run verde.
- Imagens base `node:22-alpine` e `nginx:alpine` atualizadas, com
  `apk upgrade --no-cache` para absorver correções do Alpine.

## [1.0.0] - Não publicado (escopo local)

> Versão de produto concluída e aprovada apenas para execução local. Não houve
> tag `v1.0.0`, merge em `main` ou release público; a `TASK-013` permanece fora
> do escopo local aprovado.

### Added

- Plataforma fullstack de simulação e monitoramento IoT industrial.
- Simulador de sensores de temperatura, pressão, umidade e vibração.
- API REST + WebSocket com Express, Socket.io e MongoDB Timeseries.
- Dashboard em tempo real com Vue 3, Pinia, Tailwind CSS e ECharts.
- Autenticação JWT, refresh rotativo, MFA TOTP e RBAC.
- Deduplicação de alertas com auto-resolução.
- Nginx como reverse proxy no ambiente de produção.
- Stack de observabilidade com Prometheus, Grafana e Loki.
- OpenAPI/Swagger em `/api/docs`.
- GitHub Actions CI com testes, cobertura, análise estática, detecção de
  segredos, scan de imagens, SBOM e DAST.
- Docker Compose para desenvolvimento, produção e perfil seguro local.
- Lifecycle local seguro com secrets e certificados efêmeros.

### Changed

- Padrão Repository para abstração do MongoDB.
- Padrão Strategy para cálculo de thresholds por tipo de sensor.
- Contrato de API padronizado com envelopes de resposta.
- Interceptors Axios no frontend para tratamento transparente de erros.
- Design system Vue com `BaseButton`, `BaseCard` e `ToastNotification`.

### Fixed

- `SIMULATOR_SENSORS_COUNT` agora representa o total real de sensores; o padrão
  de 8 deixa de criar 16 sensores.
- O intervalo de publicação do simulador não é mais duplicado após reconexão.
- O simulador encerra o intervalo e o publisher em `SIGTERM`/`SIGINT`.
- Rota `readings` usando `readingService` corretamente (TASK-002).
- Stores Pinia sem duplo `.data` no interceptor Axios (TASK-003).
- Testes validando o contrato de resposta da API (TASK-004).
- Testes de componentes Vue (TASK-005).
- Determinismo da admissão de sessões no CI (TASK-015).

### Security

- Hardening alinhado ao OWASP Top 10:2025 e OWASP ASVS 5.0.0 Level 2.
- mTLS e certificados X.509 individuais entre workloads.
- TLS no MongoDB, no broker MQTT e no edge local.
- Secrets locais fora do Git, entregues por Docker secrets e destruídos no teardown.
- Gates de supply chain e DAST no CI.
