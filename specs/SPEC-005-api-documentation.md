# SPEC-005: Documentação de API com OpenAPI (Swagger)

## 1. Objetivo
Prover uma documentação padronizada, interativa e sempre atualizada das rotas REST disponíveis, facilitando a integração de desenvolvedores terceiros ao sistema de simulação de sensores.

## 2. Escopo
- **Backend (`iot_api`)**: Definições OpenAPI nas rotas Express e montagem da interface do Swagger.

## 3. Requisitos Funcionais

### 3.1. Integração Swagger
- O projeto deve utilizar `swagger-jsdoc` e `swagger-ui-express`.
- A interface de documentação ficará disponível no endpoint `/api/docs`.

### 3.2. Conteúdo da Documentação
- Todas as rotas sob `/api/v1` devem ter anotações JSDoc contendo a especificação de parâmetros (ex: query parameters de filtragem ou paginação), formato de requisição e modelo de resposta.
- O contrato padronizado (`{ success, data, meta }` e `{ success, error }`) desenvolvido na SPEC-001 deve ser mapeado como um `Component Schema` no Swagger.
- A segurança via JWT Bearer (da SPEC-003) deve estar representada nos endpoints correspondentes, permitindo autenticação direto na UI do Swagger.

## 4. Padrões de Aceite e Arquitetura
- Nenhuma alteração arquitetural severa; adoção estritamente baseada em anotações JSDoc para que a documentação conviva na mesma árvore de arquivos do código (`routes/*.js`), evitando um grande arquivo `.yaml` monolítico desatualizado.

## 5. Tasks Relacionadas
- [TASK-011-openapi-swagger.md](../tasks/TASK-011-openapi-swagger.md)
