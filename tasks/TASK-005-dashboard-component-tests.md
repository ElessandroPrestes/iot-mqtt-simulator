# TASK-005: Criar testes de componentes Vue e composables

## Fase
**1 — Estabilização (Bugs Críticos)**

## Prioridade
**P1 — Alta**

## Problema (Bug B5)
Os diretórios de testes do dashboard para componentes e composables existem mas contêm apenas `.gitkeep`:
- `services/dashboard/tests/unit/components/`
- `services/dashboard/tests/unit/composables/`

## Escopo
- `services/dashboard/tests/unit/components/` — testes de componentes UI
- `services/dashboard/tests/unit/composables/` — testes de composables

## O que Fazer

### 1. Testes de Componentes (`@vue/test-utils` + Vitest)

#### `BaseButton.test.js`
- Renderiza com slot padrão
- Emite evento `click` ao clicar
- Aplica variante correta (`primary`, `secondary`, etc.)
- Fica desabilitado com `:disabled="true"`

#### `BaseCard.test.js`
- Renderiza conteúdo via slot
- Aplica classe CSS correta

#### `ToastNotification.test.js`
- Exibe mensagem quando `notificationStore.visible` é `true`
- Exibe tipo correto (error, success, warning)
- Fecha ao clicar no botão de fechar

#### `MetricBadge.test.js`
- Renderiza `label` e `value` passados por props
- Aplica variante correta (accent, critical, warning, etc.)

### 2. Testes de Composables

#### `useSocket.test.js`
- Mockar `socket.io-client`
- Verificar que `updateReading` é chamado ao receber evento `reading:new`
- Verificar que alert store é atualizado ao receber `alert:new`
- Verificar que `connectionStore.setStatus` é chamado em connect/disconnect

## Dependências
- `@vue/test-utils` — já instalado
- `vitest` — já instalado
- `jsdom` — já instalado

## Critério de Aceite
- [ ] Pelo menos 1 teste por componente UI (`BaseButton`, `BaseCard`, `ToastNotification`, `MetricBadge`)
- [ ] Teste para `useSocket` composable
- [ ] `npm test` no dashboard passa com os novos testes

## Status
🔴 **Aberto**
