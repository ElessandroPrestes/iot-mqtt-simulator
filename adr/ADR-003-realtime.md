# ADR-003: Push em Tempo Real via Socket.io

**Status**: Aceito
**Data**: 2026-07-22

## Contexto
O Dashboard precisa exibir os dados gerados pelos sensores e alertas de violação de threshold assim que eles acontecem, sem delays de polling HTTP.

## Decisão
Implementar WebSocket via pacote Socket.io entre a API Node.js e o Frontend Vue.js, no lugar de WebSockets puros ou SSE, garantindo compatibilidade, auto-reconnect nativo e namespaces/rooms caso necessários futuramente.

## Consequências
- Diminuição extrema de overhead HTTP para tráfego contínuo.
- A API Node.js é o gargalo centralizador para redistribuição. Múltiplas instâncias Node exigiriam Redis Adapter pro Socket.io (não implementado atualmente).
