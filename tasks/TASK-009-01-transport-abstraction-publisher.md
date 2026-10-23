# TAREFA (TASK): Abstração de transporte e publisher local

## Metadados

| Campo | Valor |
|---|---|
| ID | TASK-009-01 |
| Status | Done (Concluído) |
| Responsável | Engenharia |
| Refs: | SPEC: SPEC-009; Critérios de aceitação: AC-001, AC-002, AC-003, AC-005; ADRs: ADR-008 |
| Dependências | SPEC-009 aprovada |

## Objetivo

Introduzir a seleção `local|azure`, extrair o publisher do simulador, preservar
o modo local e corrigir o ciclo de vida e a contagem de sensores, sem
implementar ainda o publisher Azure nem o ingress Azure.

## Escopo

### Incluído

- Configuração `TELEMETRY_TRANSPORT`, com padrão `local` e validação estrita.
- Interface comum de publisher (`publish`, `stop`).
- `LocalMqttPublisher` com tópicos, QoS 1 e payload atuais.
- Fábrica de sensores com `SIMULATOR_SENSORS_COUNT` como total.
- Ciclo de vida único do simulador, com `SIGTERM`/`SIGINT` e `stop()`
  idempotente.
- Testes unitários de configuração, publisher local, fábrica e lifecycle.
- Ajuste do README/PROJECT/CHANGELOG somente no que for necessário para
  descrever a semântica de contagem e a flag.

### Excluído

- SDK Azure, conexão com IoT Hub e credenciais Azure.
- Ingress Azure na API.
- Alterações no dashboard ou nos contratos REST.
- Provisionamento de recursos Azure.
- Commit, push ou release.

## Abordagem e impacto

- **Arquivos prováveis:** `services/simulator/src/config.js`,
  `services/simulator/src/index.js`, novos
  `services/simulator/src/publishers/localMqttPublisher.js`,
  `services/simulator/src/sensors/factory.js`, testes do simulador,
  `README.md`, `PROJECT.md` e `CHANGELOG.md`.
- **Dados, contratos ou migrações:** nenhum dado persistido; o payload e os
  tópicos locais não mudam.
- **Riscos e salvaguardas:** a correção da contagem altera o número de sensores
  locais; cobrir com teste e registrar no changelog. A reconexão deve manter um
  único intervalo.
- **ADRs e padrões aplicáveis:** ADR-008, `standards/quality-gates.md`,
  `standards/testing.md`.

## Etapas (Steps)

- [x] Adicionar `TELEMETRY_TRANSPORT` à configuração do simulador.
- [x] Criar a interface e o `LocalMqttPublisher`.
- [x] Extrair a fábrica de sensores e corrigir a semântica de contagem.
- [x] Mover o intervalo para fora do handler `connect` e implementar lifecycle.
- [x] Adicionar testes de configuração, publisher, fábrica, reconexão e shutdown.
- [x] Executar a regressão do simulador e do modo local.
- [x] Atualizar a documentação afetada.

## Validação

| Critério/risco | Teste, comando, ou revisão | Evidência esperada |
|---|---|---|
| AC-001 | `npm test` no simulador + regressão local | Publisher local mantém tópicos, QoS 1 e payload |
| AC-002 | Teste da fábrica com `SIMULATOR_SENSORS_COUNT=8` | Exatamente 8 sensores, distribuição determinística |
| AC-003 | Teste de seleção de transporte | `local` não importa/inicializa SDK Azure |
| AC-005 | Teste de reconexão e `stop()` | Um intervalo ativo; shutdown idempotente |
| Regressão | `npm test` em simulador, API e dashboard | Todos os testes existentes passam |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis foram aprovados.
- [x] A documentação e rastreabilidade estão atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças feitas: configuração `TELEMETRY_TRANSPORT`; publisher local e fábrica
  de publishers; fábrica determinística de sensores; `Simulator` com intervalo
  único e `stop()` idempotente; bootstrap com `SIGTERM`/`SIGINT`; testes e
  documentação afetada.
- Evidência: `npm test` no simulador com 7 suítes e 50 testes; cobertura global
  de 97,65% statements, 90,22% branches, 91,66% functions e 98,51% lines;
  regressão da API e do dashboard executada sem alteração de código.
- Trabalho em aberto ou bloqueios (blockers): publisher Azure e ingress Azure
  permanecem nas TASK-009-02 a TASK-009-04; `TELEMETRY_TRANSPORT=azure` falha
  explicitamente até a TASK-009-02.
