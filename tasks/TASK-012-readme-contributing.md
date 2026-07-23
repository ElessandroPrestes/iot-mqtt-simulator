# TASK-012: README.md Completo e CONTRIBUTING.md

## Fase
**5 — Documentação e Release**

## Prioridade
**P3 — Normal**

## Problema (D1, D3, D4)
O `README.md` atual tem 4KB e cobre apenas o básico. Faltam: quick start real, guia de testes, contexto do case empresarial, CONTRIBUTING.md.

## Escopo
- `README.md` — reescrever completo
- `CONTRIBUTING.md` (NOVO)

## Estrutura do README.md

```markdown
# IoT MQTT Simulator — Industrial Monitoring Platform

## 🏭 Sobre o Projeto
[Contexto do case: fábrica industrial, sensores, alertas em tempo real]

## 🏗️ Arquitetura
[Diagrama ASCII do PROJECT.md]
[Tabela de serviços com portas]

## 🚀 Quick Start (< 5 minutos)
1. Pré-requisitos (Docker, Docker Compose)
2. Clone o repositório
3. Copiar .env.example → .env
4. docker compose up -d
5. Acessar: Dashboard, API, Grafana, Swagger

## 📡 APIs Disponíveis
[Tabela de endpoints]
[Payload MQTT de exemplo]
[Eventos WebSocket]

## 🧪 Testes
cd services/api && npm run test:coverage
cd services/simulator && npm test
cd services/dashboard && npm test

## 📊 Observabilidade
[Como acessar Prometheus :9090]
[Como acessar Grafana :3001]

## 🔧 Variáveis de Ambiente
[Tabela principal do PROJECT.md]

## 🏢 Caso de Uso Empresarial
[Explicação de como adaptar para ambiente real]
[Diagrama de substituição do Simulator por sensores reais]

## 📚 Documentação Adicional
- docs/IMPLEMENTATION_PLAN.md
- adr/ (Architecture Decision Records)
- specs/ (Feature Specifications)
```

## Estrutura do CONTRIBUTING.md

```markdown
# Como Contribuir

## Pré-requisitos
## Setup do Ambiente de Desenvolvimento
## Fluxo de Branches (GitFlow simplificado)
## Padrão de Commits (Conventional Commits)
## Como Criar uma Nova Feature
  1. Criar SPEC em specs/
  2. Aguardar aprovação
  3. Criar TASK em tasks/
  4. Implementar
  5. Testes
  6. PR para develop
## Como Reportar um Bug
## Code Review Checklist
```

## Critério de Aceite
- [ ] Desenvolvedor novo consegue rodar o projeto do zero em < 5 minutos seguindo o README
- [ ] Todos os links do README apontam para recursos reais
- [ ] `CONTRIBUTING.md` explica o fluxo SDD do projeto
- [ ] Screenshots ou GIF do dashboard no README (opcional, mas impactante)

## Status
🔴 **Aberto**
