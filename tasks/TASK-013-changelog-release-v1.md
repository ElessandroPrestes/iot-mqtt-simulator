# TASK-013: CHANGELOG e Release v1.0.0

## Fase
**5 — Documentação e Release**

## Prioridade
**P3 — Normal (última task)**

## Contexto
Com todas as tasks anteriores concluídas, o projeto estará pronto para ser declarado como `v1.0.0`. Esta task formaliza o release.

## Escopo
- `CHANGELOG.md` (NOVO)
- Tag Git `v1.0.0`
- Merge `develop` → `main`

## O que Fazer

### 1. Criar CHANGELOG.md
Seguindo o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/):

```markdown
# Changelog

## [1.0.0] - YYYY-MM-DD

### Added
- Plataforma fullstack de simulação e monitoramento IoT industrial
- Simulador de sensores: temperatura, pressão, umidade, vibração
- API REST + WebSocket com Express.js e Socket.io
- Dashboard em tempo real com Vue 3, Pinia e ECharts
- Autenticação JWT na API REST
- Deduplicação de alertas com auto-resolução
- nginx como reverse proxy no ambiente de produção
- Stack de observabilidade: Prometheus + Grafana
- OpenAPI/Swagger em /api/docs
- GitHub Actions CI (testes automáticos)
- Docker Compose para desenvolvimento e produção

### Architecture
- Padrão Repository para abstração do MongoDB
- Padrão Strategy para cálculo de thresholds por tipo de sensor
- Contrato de API padronizado { success, data, meta }
- Interceptors Axios no frontend para tratamento transparente de erros
- Design System Vue: BaseButton, BaseCard, ToastNotification

### Fixed
- TASK-002: Rota readings.js usando readingService corretamente
- TASK-003: Stores Pinia sem duplo .data no interceptor Axios
- TASK-004: Testes validando contrato { success, data, meta }
- TASK-005: Testes de componentes Vue criados
```

### 2. Atualizar PROJECT.md
- Mudar **Status** de "Em desenvolvimento ativo" para "Concluído — v1.0.0"
- Atualizar seção de limitações conhecidas para refletir o que foi resolvido

### 3. Comandos Git
```bash
# Garantir que develop está atualizado
git checkout develop
git pull origin develop

# Merge para main
git checkout main
git merge --no-ff develop -m "chore(release): merge develop → main for v1.0.0"

# Criar tag anotada
git tag -a v1.0.0 -m "Release v1.0.0 — IoT MQTT Simulator

Case empresarial completo de monitoramento IoT industrial.
Ver CHANGELOG.md para detalhes completos."

# Push
git push origin main
git push origin v1.0.0
```

## Critério de Aceite
- [ ] `CHANGELOG.md` criado com todas as mudanças documentadas
- [ ] `PROJECT.md` atualizado com status final
- [ ] Tag `v1.0.0` no repositório (local e remote)
- [ ] Branch `main` reflete o estado de produção
- [ ] CI verde na branch `main`
- [ ] Todos os critérios do `docs/IMPLEMENTATION_PLAN.md` — Seção "Definição de Concluído" ✅

## Pré-condição
**Todas as TASK-002 a TASK-012 devem estar concluídas antes desta task.**

## Status
🔴 **Aberto**
