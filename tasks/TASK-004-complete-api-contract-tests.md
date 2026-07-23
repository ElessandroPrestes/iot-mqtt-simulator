# TASK-004: Completar testes de contrato e cobertura da API

## Fase
**1 — Estabilização (Bugs Críticos)**

## Prioridade
**P1 — Alta**

## Problema (Bug B4)
Os testes de integração validam o comportamento das rotas mas **não validam o contrato de resposta** (`{ success, data, meta }`). Além disso, faltam testes unitários para `thresholdStrategy.js` e `responseFormatter.js`.

## Escopo
- `services/api/tests/integration/routes/*.test.js` — adicionar assertions de contrato
- `services/api/tests/unit/utils/` — criar testes para utils
- `services/api/tests/unit/strategies/` — criar testes para strategies

## O que Fazer

### 1. Testes de integração — adicionar validação do envelope

Em **todos** os testes de rota com resposta 2xx, adicionar:
```js
expect(res.body.success).toBe(true);
expect(res.body).toHaveProperty('data');
// onde aplicável:
expect(res.body).toHaveProperty('meta');
```

Em **todos** os testes de rota com resposta 4xx/5xx, adicionar:
```js
expect(res.body.success).toBe(false);
expect(res.body).toHaveProperty('error');
expect(res.body.error).toHaveProperty('code');
expect(res.body.error).toHaveProperty('message');
```

### 2. Teste unitário para `responseFormatter.js`
- Criar `tests/unit/utils/responseFormatter.test.js`
- Testar `successResponse(data, meta)` com e sem meta

### 3. Teste unitário para `thresholdStrategy.js`
- Criar `tests/unit/strategies/thresholdStrategy.test.js`
- Testar cada strategy: `temperature`, `pressure`, `humidity`, `vibration`
- Testar `classify()` para valores normal, warning e critical
- Testar `getUnit()` para cada tipo
- Testar tipo desconhecido retorna `'normal'`

## Critério de Aceite
- [ ] `npm run test:coverage` mostra ≥90% de linhas e funções na API
- [ ] ≥85% de branches
- [ ] Todos os testes de integração validam o envelope `{ success, data, meta }` ou `{ success, error }`
- [ ] `responseFormatter.js` e `thresholdStrategy.js` cobertos por testes unitários

## Status
🔴 **Aberto**
