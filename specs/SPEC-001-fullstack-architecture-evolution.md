# SPEC-001: Evolução Arquitetural Fullstack (Design System, Padrões e Contratos)

## 1. Objetivo
Elevar a maturidade arquitetural de todo o sistema. No Frontend, introduzir um Design System consistente com Vue 3 e Tailwind CSS para componentes reutilizáveis. No Backend, aplicar os padrões de projeto Repository e Strategy para melhorar a testabilidade e o isolamento do código, além de padronizar rigorosamente os contratos de comunicação da API REST.

## 2. Escopo
- **Frontend (`iot_dashboard`)**:
  - Criação de uma biblioteca de componentes base de UI (Design System) em `src/components/ui` (ex: Button, Card, Input, Modal, Toast/Notification).
  - Refatoração do `client.js` (Axios) para interceptar, extrair e tratar o novo formato de contrato padronizado da API.
- **Backend (`iot_api` / `iot_simulator`)**:
  - Implementação do padrão **Repository** em `iot_api` (abstraindo chamadas do Mongoose para coleções `Reading` e `Alert`).
  - Implementação do padrão **Strategy** em `iot_api` (para validação flexível de `thresholds` baseada em diferentes categorias de sensores).
  - Padronização de saídas da API (Middlewares/Formatters) para sucesso (`{ success: true, data: {}, meta: {} }`) e erro (`{ success: false, error: { code, message, details } }`).
  - Atualização do `errorHandler.js` para suportar o novo contrato de erro.
- **Integração**:
  - Ajuste nas actions das stores do Pinia para funcionarem perfeitamente com a nova estrutura de resposta interceptada.

## 3. Fora de Escopo
- Alterações no Broker MQTT (Eclipse Mosquitto).
- Migração para TypeScript (mantemos JavaScript conforme definido no `PROJECT.md`).
- Alteração nos tópicos MQTT ou na persistência de dados do Socket.io.
- Refatoração completa das *views* do Dashboard (apenas adaptação aos novos componentes UI necessários para tratar erros globais).

## 4. Requisitos Funcionais

### 4.1. Contrato da API (Integração)
Todos os endpoints REST devem obedecer ao seguinte formato estrito:

**Sucesso (HTTP 2xx):**
```json
{
  "success": true,
  "data": { ... }, // Payload real (objeto ou array)
  "meta": { ... }  // Dados auxiliares (paginação, timestamps) ou null
}
```

**Erro (HTTP 4xx e 5xx):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR", // Código canônico de erro (ex: NOT_FOUND, INTERNAL_ERROR)
    "message": "Mensagem descritiva para o usuário",
    "details": [...] // Array de detalhes (ex: campos inválidos do Joi)
  }
}
```

### 4.2. Backend: Design Patterns
- **Repository Pattern (`src/repositories/`)**: Classes ou módulos responsáveis exclusivos por interagir com `Reading` e `Alert`. Services (`readingService.js`, `alertService.js`) não devem importar models do Mongoose diretamente, apenas seus repositórios correspondentes.
- **Strategy Pattern (`src/utils/thresholds.js`)**: O cálculo de *warning* e *critical* deve ser refatorado para um contexto que delega a validação para estratégias específicas de sensores (ex: `TemperatureStrategy`, `VibrationStrategy`), permitindo expansão fácil de novas regras (ex: "mean reversion" ou limites móveis).

### 4.3. Frontend: Design System & Interceptors
- **Design System**: Mínimo de 3 novos componentes utilitários de interface em Vue (`BaseButton`, `BaseCard`, `ToastNotification`) centralizando regras estéticas do Tailwind.
- **Axios Interceptor (`src/api/client.js`)**:
  - *Response*: Retornar diretamente `response.data.data` para as stores se `success: true`.
  - *Error*: Capturar `error.response.data.error`, formatar e invocar a notificação de erro global na UI (Toast) antes de propagar o reject para a store.

## 5. Critérios de Aceite
- [ ] O `iot_api` possui o diretório `repositories/` separando a lógica do banco de dados dos serviços.
- [ ] O cálculo de thresholds utiliza o padrão Strategy, eliminando `if/else` ou objetos soltos genéricos para diferentes comportamentos de sensor.
- [ ] Todos os requests GET, POST, PATCH da API respondem envelopados no padrão `{ success, data, meta }` ou `{ success, error }`.
- [ ] O `client.js` do Vue possui interceptors implementados validando os contratos novos da API sem quebrar as views existentes.
- [ ] Um sistema de Notificação (Toast) feito com Design System visual (Tailwind) está disparando ao receber os erros formatados da API (HTTP 4xx/5xx).
- [ ] Os testes unitários existentes e de integração da API continuam com >90% de coverage e foram ajustados ao novo formato de resposta JSON.

## 6. ADRs Referenciados
- **ADR-001-architecture.md** (Microserviços baseados em eventos)
- Adoção dos novos padrões poderá gerar um futuro ADR-005 para padronização de contratos de API e uso do Padrão Repository, a ser definido na documentação caso aprovado.
