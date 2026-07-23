# SPEC-003: Segurança da API e Autenticação JWT

## 1. Objetivo
Proteger os endpoints REST e WebSocket contra acesso não autorizado, para viabilizar o IoT MQTT Simulator como um ambiente de demonstração corporativo seguro.

## 2. Escopo
- **Backend (`iot_api`)**: Criação de rotas de login, middleware JWT e proteção de rotas privadas.
- **Frontend (`iot_dashboard`)**: Adaptação do interceptor do Axios e armazenamento de tokens.

## 3. Requisitos Funcionais

### 3.1. Rota de Autenticação
- Implementar o endpoint `POST /api/v1/auth/login`.
- Como não há coleção de usuários no MongoDB para simplificação do case, a validação deve ocorrer contra credenciais fixas definidas nas variáveis de ambiente (`DEMO_USER` e `DEMO_PASSWORD`).
- A rota deve retornar um JWT Bearer Token assinado usando `AUTH_SECRET` e com expiração baseada em `AUTH_EXPIRES_IN`.

### 3.2. Proteção de Rotas (Middleware)
- Criar o middleware `authenticate.js` que verifica a presença e validade do token JWT no cabeçalho `Authorization: Bearer <token>`.
- **Rotas Privadas:** Todas sob `/api/v1/*` (ex: `/readings`, `/sensors`, `/alerts`), exceto o login.
- **Rotas Públicas:** `/health` e `/metrics` devem permanecer acessíveis para o Prometheus e Load Balancers/Health Checks, sem requerer token.

### 3.3. Integração do Dashboard
- O client HTTP (Axios) do Vue deve adicionar automaticamente o cabeçalho `Authorization` nas requisições, recuperando o token do `localStorage` (ou sessionStorage/Pinia state).

## 4. Padrões de Aceite e Arquitetura
- Uso da biblioteca `jsonwebtoken` no Node.js.
- Respostas não autorizadas devem retornar HTTP 401 ou 403 com a estrutura de erro padrão do sistema (`{ success: false, error: {...} }`).

## 5. Tasks Relacionadas
- [TASK-008-jwt-authentication.md](../tasks/TASK-008-jwt-authentication.md)
