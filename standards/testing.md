# Padrões de Testes

## Backend API
- Mínimo de 90% de cobertura (lines, functions, statements) e 85% de branches.
- Rotas testadas com `supertest`.
- Banco de dados mockado com `mongodb-memory-server` em testes de integração.

## Dashboard Vue
- Vitest para unit testing, cobrindo as lógicas das stores (Pinia) e helpers (Composables).
- Componentes chave testados via `@vue/test-utils` e ambiente JS DOM.
