# TASK-001: Evolução Arquitetural Fullstack

## SPEC Associada
[SPEC-001-fullstack-architecture-evolution.md](../specs/SPEC-001-fullstack-architecture-evolution.md)

## 1. Modificações Necessárias

### 1.1 Backend (`iot_api`)
- `services/api/src/utils/responseFormatter.js` (NOVO): Criar utilitário para formatar sucesso.
- `services/api/src/middleware/errorHandler.js`: Atualizar contrato de erro (`success: false`).
- `services/api/src/repositories/readingRepository.js` (NOVO): Extrair lógica do banco para `Reading`.
- `services/api/src/repositories/alertRepository.js` (NOVO): Extrair lógica do banco para `Alert`.
- `services/api/src/services/readingService.js`: Refatorar para usar repositório.
- `services/api/src/services/alertService.js`: Refatorar para usar repositório.
- `services/api/src/strategies/thresholdStrategy.js` (NOVO): Implementar padrão Strategy para lógicas de alertas.
- `services/api/src/routes/*.js`: Envelopar todas as rotas com `responseFormatter`.

### 1.2 Frontend (`iot_dashboard`)
- `services/dashboard/src/components/ui/BaseButton.vue` (NOVO): Componente de Design System (Tailwind).
- `services/dashboard/src/components/ui/BaseCard.vue` (NOVO): Componente de Design System.
- `services/dashboard/src/components/ui/ToastNotification.vue` (NOVO): Para notificações e erros.
- `services/dashboard/src/stores/notification.js` (NOVO): Pinia store simples para o Toast.
- `services/dashboard/src/api/client.js`: Criar interceptors Axios para `{ success, data/error }`.
- `services/dashboard/src/stores/*.js`: Adaptar chamadas para ler os dados do novo contrato sem quebrar as views.

## 2. Ordem de Implementação
1. **API:** Criar `responseFormatter` e atualizar `errorHandler`.
2. **API:** Refatorar as Rotas da API para enviar as respostas no novo contrato envelopado. (Isto deve quebrar temporariamente o frontend e os testes locais).
3. **API:** Implementar `repositories/` e integrá-los no `readingService` e `alertService`.
4. **API:** Refatorar lógicas de alerta para usar `strategies/`.
5. **Dashboard:** Atualizar `client.js` com interceptor Axios.
6. **Dashboard:** Criar store de `notification` e os componentes UI `ToastNotification`, `BaseButton`, `BaseCard`.
7. **Dashboard:** Ajustar stores do Pinia para que leiam o payload correto e passem pelas actions sem impactar a UI.
8. **Testes:** Ajustar testes unitários/integração do Node e Dashboard para validar os novos contratos JSON.

## 3. Checklist de Validação
- [x] Backend envia `{ success: true, data: {...} }`.
- [x] Backend envia `{ success: false, error: {...} }`.
- [x] Repositórios isolam os models do Mongoose com sucesso.
- [x] Strategy resolve o tipo de sensor sem usar estruturas `if/else` rígidas soltas.
- [x] Frontend processa interceptors transparentemente e exibe Toast de erro se request falhar.
- [x] Todos os testes (`npm run test`) passam na API e Dashboard com a mudança de payload.
