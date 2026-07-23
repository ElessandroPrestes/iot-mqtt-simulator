# TASK-006: Validar e Fixar CI GitHub Actions

## Fase
**2 — Qualidade e Cobertura**

## Prioridade
**P1 — Alta**

## Contexto
O arquivo `.github/workflows/ci.yml` existe mas nunca foi confirmado como funcional em push real. Precisa ser validado localmente e ajustado se necessário.

## Escopo
- `.github/workflows/ci.yml`
- Configurações de cada serviço que o CI executa

## O que Fazer

### 1. Simular ambiente CI localmente
```bash
# Job: api
cd services/api
npm ci
npm run test:coverage

# Job: simulator
cd services/simulator
npm ci
npm test

# Job: dashboard
cd services/dashboard
npm ci
npm test
npm run build
```

### 2. Pontos de atenção
- `mongodb-memory-server` no job `api`: precisa de binário baixado — verificar estratégia de cache no CI
- `--experimental-vm-modules` no job `simulator`: garantir que o `jest.config.js` está correto
- `npm run build` no dashboard: verificar se variáveis de ambiente de produção estão definidas
- Verificar se `actions/setup-node` usa cache de `node_modules` corretamente

### 3. Possíveis ajustes no `ci.yml`
- Adicionar `cache: 'npm'` no step `setup-node`
- Adicionar variáveis de ambiente necessárias para os testes
- Confirmar que o job `ci-ok` agrega os 3 jobs corretamente

## Critério de Aceite
- [ ] Push na branch `develop` gera CI verde no GitHub Actions
- [ ] Todos os 3 jobs (`api`, `simulator`, `dashboard`) passam
- [ ] Job `ci-ok` passa somente quando os 3 anteriores têm sucesso

## Status
🟡 **Não Validado**
