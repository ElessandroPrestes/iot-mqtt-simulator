# TAREFA (TASK): Publisher Azure IoT Hub e guarda de custo

## Metadados

| Campo | Valor |
|---|---|
| ID | TASK-009-02 |
| Status | Done (Concluído) |
| Responsável | Engenharia |
| Refs: | SPEC: SPEC-009; Critérios de aceitação: AC-004, AC-011, AC-012; ADRs: ADR-008 |
| Dependências | TASK-009-01 |

## Objetivo

Implementar o publisher Azure IoT Hub no simulador, com contrato de mensagem
correto, segredos protegidos e bloqueio de configuração que exceda o orçamento
diário autorizado.

## Escopo

### Incluído

- Dependências `azure-iot-device` e `azure-iot-device-mqtt` no simulador.
- `AzureIotHubPublisher` com tópico fixo do dispositivo, corpo JSON,
  `messageId`, `contentType` e `contentEncoding`.
- Configuração Azure por ambiente e `_FILE`.
- Redaction no logger do simulador.
- Cálculo de mensagens/dia e guarda `AZURE_DAILY_MESSAGE_BUDGET` /
  `AZURE_ALLOW_OVERAGE`.
- Testes com SDK mockado, incluindo falha de conexão e retry.
- Atualização de `.env.example` com placeholders, sem valores reais.

### Excluído

- Provisionamento de IoT Hub ou dispositivo.
- Teste real no Azure sem autorização.
- Ingress Azure na API.
- Checkpoint, Blob Storage ou Event Hubs dedicado.
- Commit, push ou release.

## Abordagem e impacto

- **Arquivos prováveis:** novo
  `services/simulator/src/publishers/azureIotHubPublisher.js`,
  `services/simulator/src/config.js`, `services/simulator/src/logger.js`,
  `services/simulator/src/index.js`, testes, `services/simulator/package.json`,
  lockfile e `.env.example`.
- **Dados, contratos ou migrações:** nenhum dado persistido; a mensagem Azure
  reutiliza o JSON atual.
- **Riscos e salvaguardas:** connection string nunca pode ser logada; falha de
  configuração deve ser explícita; retry não pode gerar volume descontrolado.
  Testes não devem exigir conta Azure.
- **ADRs e padrões aplicáveis:** ADR-008, `standards/security.md`,
  `standards/testing.md`.

## Etapas (Steps)

- [x] Adicionar as dependências Azure do dispositivo e atualizar o lockfile.
- [x] Implementar `AzureIotHubPublisher`.
- [x] Implementar leitura de secrets por ambiente/`_FILE` e validação.
- [x] Implementar redaction no logger do simulador.
- [x] Implementar guarda de custo e mensagem de erro acionável.
- [x] Adicionar testes com SDK mockado e teste da guarda.
- [x] Atualizar `.env.example` e a documentação de configuração.

## Validação

| Critério/risco | Teste, comando, ou revisão | Evidência esperada |
|---|---|---|
| AC-004 | Teste unitário do publisher com SDK mockado | Tópico fixo, JSON, `messageId`, content type/encoding |
| AC-011 | Teste de redaction e inspeção de logs | Nenhum segredo em log ou erro |
| AC-012 | Teste da guarda com perfil acima do orçamento | Falha explícita sem `AZURE_ALLOW_OVERAGE=true` |
| Regressão | `npm test` no simulador | Testes locais continuam passando |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis foram aprovados.
- [x] A documentação e rastreabilidade estão atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças feitas: `AzureIotHubPublisher`, configuração Azure por ambiente/`_FILE`, guarda de custo, redaction no logger, dependências e testes.
- Evidência: 11 testes do publisher; 76 testes totais no simulador; cobertura 97,79% statements, 92,42% branches, 92,3% functions, 98,64% lines; API 194/194; dashboard 59/59.
- Trabalho em aberto ou bloqueios (blockers): teste real no Azure não executado; X.509 e Event Hubs ficam nas tarefas seguintes; `npm audit` mantém 5 avisos moderados transitivos via `uuid`/`@azure/core-http`, sem caminho de execução no `sendEvent` usado.
