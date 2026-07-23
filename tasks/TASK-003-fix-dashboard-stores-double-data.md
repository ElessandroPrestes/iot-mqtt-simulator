# TASK-003: Corrigir duplo `.data` nas stores do dashboard

## Fase
**1 — Estabilização (Bugs Críticos)**

## SPEC Associada
Sem SPEC dedicada — corrige gap de implementação da [SPEC-001](../specs/SPEC-001-fullstack-architecture-evolution.md)

## Prioridade
**P0 — Crítico (causa bug em runtime)**

## Problema (Bugs B2 e B3)
O interceptor Axios em `services/dashboard/src/api/client.js` já retorna `response.data` — ou seja, o envelope completo `{ success, data, meta }`. Porém as stores do Pinia ainda leem `response.data.data`, resultando em `undefined` ao tentar acessar os dados.

### Exemplo do bug em `sensors.js`
```js
// client.js interceptor retorna response.data, ou seja: { success, data, meta }
// A store faz:
response.data.data.forEach(...)  // response.data já É o envelope → .data.data é undefined
// Correto:
response.data.forEach(...)       // response.data = array de sensores
```

## Escopo
- `services/dashboard/src/stores/sensors.js`
- `services/dashboard/src/stores/alerts.js`
- Verificar também: `services/dashboard/src/stores/connection.js`

## O que Fazer

### sensors.js — fetchLatest
```diff
- response.data.data.forEach(r => readings.value.set(r.sensorId, r));
+ response.data.forEach(r => readings.value.set(r.sensorId, r));
```

### sensors.js — fetchStats
```diff
- stats.value = response.data.data;
+ stats.value = response.data;
```

### alerts.js — fetchAlerts
```diff
- alerts.value = response.data.data;
+ alerts.value = response.data;
```

> **Nota:** Verificar se o mock nos testes também precisa ser ajustado.
> Os mocks em `tests/unit/stores/sensors.test.js` devem simular o que o interceptor retorna,
> não o que a API retorna (ou seja, sem o envelope externo).

## Critério de Aceite
- [ ] `npm test` no dashboard passa sem erros
- [ ] O dashboard carrega dados de sensores e alertas ao rodar `docker compose up`
- [ ] Mocks dos testes de store alinham com o comportamento do interceptor

## Status
🔴 **Aberto**
