# TASK-002: Corrigir rota readings.js para usar readingService

## Fase
**1 — Estabilização (Bugs Críticos)**

## SPEC Associada
Sem SPEC dedicada — corrige gap de implementação da [SPEC-001](../specs/SPEC-001-fullstack-architecture-evolution.md)

## Prioridade
**P0 — Crítico**

## Problema (Bug B1)
A rota `services/api/src/routes/readings.js` importa e chama o model `Reading` do Mongoose diretamente, ignorando o `readingService` e o `readingRepository` que foram criados como parte da TASK-001 (padrão Repository).

Isso viola o padrão arquitetural definido na SPEC-001 e torna os testes de unidade do service inúteis para validar o comportamento real das rotas.

## Escopo
- `services/api/src/routes/readings.js`

## O que Fazer

### 1. Remover import direto do model
```js
// REMOVER esta linha da rota:
const Reading = require('../models/Reading');
```

### 2. Usar readingService nos handlers
```js
const readingService = require('../services/readingService');
const { successResponse } = require('../utils/responseFormatter');

// GET /api/v1/readings — usar findAll do service
const result = await readingService.findAll(value);
res.json(successResponse(result.data, {
  page: result.page,
  limit: result.limit,
  total: result.total,
  pages: result.pages,
}));

// GET /api/v1/readings/latest — usar findLatestPerSensor
const latest = await readingService.findLatestPerSensor();
res.json(successResponse(latest));

// GET /api/v1/readings/stats — usar findStats
const stats = await readingService.findStats(sinceMs);
res.json(successResponse(stats, { since }));
```

## Critério de Aceite
- [ ] `readings.js` não importa nenhum model Mongoose diretamente
- [ ] Todos os testes de integração em `tests/integration/routes/readings.test.js` continuam passando
- [ ] `npm run test:coverage` na API mantém ≥90%

## Status
🔴 **Aberto**
