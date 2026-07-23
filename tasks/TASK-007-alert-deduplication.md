# TASK-007: Deduplicação de Alertas

## Fase
**2 — Qualidade e Cobertura**

## SPEC Associada
Limitação conhecida registrada no [PROJECT.md](../PROJECT.md) — Seção 15

## Prioridade
**P1 — Alta (negócio crítico)**

## Problema (Feature F1)
A cada leitura de sensor fora do limite, um novo alerta é criado no MongoDB, mesmo que o sensor já esteja em estado de alerta. Isso gera:
- Spam de alertas no banco de dados (dados duplicados)
- Dashboard exibindo dezenas de alertas para o mesmo sensor
- Impossibilidade de rastrear a duração real de um evento

## Escopo
- `services/api/src/repositories/alertRepository.js`
- `services/api/src/services/mqttService.js`
- `services/api/tests/unit/services/` — novos testes

## O que Fazer

### 1. Adicionar `findActiveAlert` no alertRepository
```js
async findActiveAlert(sensorId, level) {
  return Alert.findOne({ sensorId, level, resolved: false }).lean();
}
```

### 2. Adicionar `findAndAutoResolve` no alertRepository
```js
async resolveActive(sensorId) {
  return Alert.updateMany(
    { sensorId, resolved: false },
    { resolved: true, resolvedAt: new Date() }
  );
}
```

### 3. Lógica no mqttService
```js
if (status !== 'normal') {
  // Só cria alerta se não existe alerta ativo para esse sensor+level
  const existing = await alertRepository.findActiveAlert(data.sensorId, status);
  if (!existing) {
    const alert = await alertRepository.create({ ... });
    io?.emit('alert:new', alert);
  }
} else {
  // Sensor voltou ao normal — auto-resolve alertas ativos
  await alertRepository.resolveActive(data.sensorId);
}
```

### 4. Testes unitários
- Criar `tests/unit/services/mqttService.test.js` (ou `alertDeduplication.test.js`)
- Verificar que alerta duplicado não é criado
- Verificar que alerta é resolvido quando sensor volta ao normal

## Critério de Aceite
- [ ] Apenas 1 alerta ativo por `sensorId` + `level` em qualquer momento
- [ ] Alerta é auto-resolvido quando o sensor volta ao estado `normal`
- [ ] Testes cobrindo os dois cenários (deduplicação e auto-resolução)
- [ ] `npm run test:coverage` mantém ≥90%

## Status
🔴 **Aberto**
