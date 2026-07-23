# TASK-008: Autenticação JWT na API REST

## Fase
**3 — Segurança e Produção**

## Prioridade
**P2 — Média**

## Problema (Feature F3)
A API REST não possui nenhum mecanismo de autenticação ou autorização. Qualquer cliente com acesso à rede pode ler e modificar dados. Para um case empresarial real, autenticação é requisito mínimo.

## Escopo
- `services/api/src/routes/auth.js` (NOVO)
- `services/api/src/middleware/authenticate.js` (NOVO)
- `services/api/src/app.js` — registrar rota e middleware
- `services/dashboard/src/api/client.js` — enviar token no header
- `services/dashboard/src/stores/` — ação de login
- `.env.example` — adicionar variáveis de auth

## Stack
- `jsonwebtoken` — geração e verificação de JWT (adicionar como dependência)
- Sem banco para usuários — credenciais hardcoded via variáveis de ambiente (demo)

## O que Fazer

### 1. Variáveis de Ambiente (`.env.example`)
```env
# Auth
AUTH_SECRET=your-jwt-secret-here
AUTH_EXPIRES_IN=8h
DEMO_USER=admin
DEMO_PASSWORD=iot@demo2024
```

### 2. Rota de Login (`routes/auth.js`)
```js
POST /api/v1/auth/login
Body: { username, password }
Response: { success: true, data: { token, expiresIn } }
```

### 3. Middleware (`middleware/authenticate.js`)
```js
// Valida Bearer token no header Authorization
// Em caso de erro: { success: false, error: { code: 'UNAUTHORIZED', message: '...' } }
```

### 4. Proteger rotas em `app.js`
```js
// Rotas públicas (sem auth):
app.get('/health', ...)
app.get('/metrics', ...)
app.post('/api/v1/auth/login', ...)

// Rotas protegidas (com auth):
app.use('/api/v1', authenticate, router)
```

### 5. Dashboard — enviar token
```js
// client.js — adicionar interceptor de request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 6. Testes
- Testar `POST /api/v1/auth/login` com credenciais corretas e incorretas
- Testar rotas protegidas sem token (esperado: 401)
- Testar rotas protegidas com token válido (esperado: 200)
- Testar rotas protegidas com token expirado/inválido (esperado: 401)

## Critério de Aceite
- [ ] `POST /api/v1/auth/login` retorna JWT
- [ ] Rotas `/api/v1/**` retornam 401 sem token
- [ ] Dashboard envia token no header automaticamente
- [ ] Testes de autenticação passam
- [ ] `/health` e `/metrics` continuam sem autenticação

## Status
🔴 **Aberto**
