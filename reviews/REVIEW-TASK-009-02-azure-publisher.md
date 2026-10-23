# Review — TASK-009-02: Publisher Azure IoT Hub e guarda de custo

Spec-Ref: SPEC-009
Task-Ref: TASK-009-02

## Target

- TASK: `TASK-009-02`
- SPEC: `SPEC-009`
- ADR: `ADR-008`
- Branch: `develop`
- Escopo: simulador, configuração, logger e testes
- Data: 2026-10-23

## Status

- [ ] Approved
- [x] Approved with remarks
- [ ] Rejected

## Verificação por critério

| Critério | Resultado | Evidência |
|---|---|---|
| AC-004 | Pass | Testes com SDK mockado e com `Message` real; JSON, `messageId`, content type/encoding e propriedades de roteamento |
| AC-011 | Pass no simulador | Logger redige connection string, chaves, tokens e padrões SAS; API fica para a tarefa de ingress |
| AC-012 | Pass | Guarda bloqueia 345.600 mensagens/dia contra orçamento de 8.000 sem opt-in |
| Regressão | Pass | Simulador 76/76, API 194/194 e dashboard 59/59 |
| Cobertura | Pass | 97,79% statements, 92,42% branches, 92,3% functions, 98,64% lines |

## Evidências

- `npm test -- --runInBand` em `services/simulator`: 10 suítes, 76 testes.
- `npm run test:coverage -- --runInBand`: thresholds globais aprovados.
- `npm test -- --runInBand` em `services/api`: 32 suítes, 194 testes.
- `npm test` em `services/dashboard`: 12 arquivos, 59 testes.
- `npm audit --omit=dev`: 5 avisos moderados transitivos via `uuid` e
  `@azure/core-http`; sem correção disponível sem mudança de major.
- Inspeção do diff sem connection string real, chave SAS ou certificado.

## Ressalvas

- Revisão realizada pelo mesmo agente que implementou a tarefa. Ela não
  substitui revisão independente humana exigida antes de release.
- Nenhum teste real no Azure foi executado; não há recurso provisionado.
- O publisher usa connection string/SAS. X.509 permanece evolução preferencial.
- Não há retry automático próprio; o teste cobre nova tentativa do chamador e o
  SDK mantém a conexão. Retry automático exigiria política de idempotência.
- `AZURE_IOT_HUB_DEVICE_ID` é apenas rótulo de configuração/log; não é validado
  contra o `DeviceId` da connection string.
- O `Message` real é coberto, mas o envio de rede do SDK não é exercitado.
- Avisos de `npm audit` são transitivos e não passam pelo caminho `sendEvent`
  usado; não foi aplicado `npm audit fix --force`.
- Este review não autoriza commit, push, tag, merge em `main`, release ou deploy.

## Decisão

Aprovado com ressalvas para o escopo da TASK-009-02. O modo local permanece
padrão e o modo Azure falha de forma explícita sem configuração válida.
