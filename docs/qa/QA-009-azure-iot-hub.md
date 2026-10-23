# Plano de QA (QA Plan): Integração opcional com Azure IoT Hub

## Metadados

| Campo | Valor |
|---|---|
| ID | QA-009 |
| Status | Executing (Executando) |
| Responsável (QA owner) | Engenharia e QA |
| Build/commit | Working tree local; sem commit de implementação |
| SPEC/design relacionado | SPEC-009; ADR-008 |
| Janela de teste (Test window) | Após aprovação da SPEC-009 e implementação das TASKs |

## Escopo e objetivo de qualidade

### No escopo (In scope)

- Modo local como padrão e regressão completa.
- Seleção `local|azure` no simulador e na API.
- Publisher local e publisher Azure IoT Hub.
- Ingress Azure via endpoint interno compatível com Event Hubs.
- Pipeline compartilhado, idempotência e unicidade de alertas.
- Health e métricas por transporte.
- Redaction, secrets, guarda de custo e documentação.
- Docker opcional e rollback para o modo local.

### Fora do escopo (Out of scope)

- Provisionamento de recursos Azure: sem autorização; risco de custo; aprovador:
  Responsável do projeto.
- Teste real no Azure: opt-in, exige credenciais e autorização; aprovador:
  Responsável do projeto.
- Checkpoint com Blob Storage: fora da SPEC-009; aprovador: Responsável do
  projeto.
- Um dispositivo por sensor: evolução futura; aprovador: Responsável do
  projeto.
- Dashboard e contratos REST existentes: não devem mudar; qualquer mudança
  exige nova SPEC.
- Exactly-once: não é garantido; o aceite é at-least-once com deduplicação.

## Avaliação de risco

| ID | Risco | Impacto no usuário/sistema | Probabilidade | Resposta de teste | Responsável |
|---|---|---|---|---|---|
| R-001 | Volume Azure acima da cota gratuita | Custo e indisponibilidade | Alta | Teste da guarda e da conta de mensagens/dia | Engenharia |
| R-002 | Replay duplicar leitura/alerta | Dados incorretos e alertas repetidos | Alta | Teste de reentrega com mesmo `messageId` | Engenharia |
| R-003 | Corrida na criação de alerta | Alerta duplicado | Média | Teste concorrente e índice único parcial | Engenharia |
| R-004 | Segredo em log ou teste | Vazamento de credencial | Média | Teste de redaction e inspeção de logs | Segurança |
| R-005 | Health degraded no modo Azure | Falso negativo operacional | Média | Teste de health local/Azure | Engenharia |
| R-006 | Reconexão duplicar intervalo | Volume e custo duplicados | Média | Teste de reconexão e lifecycle | Engenharia |
| R-007 | Regressão no modo local | Quebra do produto principal | Alta | Regressão dos três serviços | QA |
| R-008 | Escopo expandido para dashboard/rotas | Mudança não aprovada | Baixa | Revisão de diff e contratos | QA |

## Abordagem de teste

| Área de teste | Nível/tipo | Automatizado/manual | Ambiente | Responsável | Evidência requerida |
|---|---|---|---|---|---|
| Funcional local | Unitário e integração | Automatizado | Local | Engenharia | `npm test` dos três serviços |
| Seleção de transporte | Unitário | Automatizado | Local | Engenharia | Testes de config e bootstrap |
| Publisher Azure | Unitário com mock | Automatizado | Local | Engenharia | Teste do contrato da mensagem |
| Ingress Azure | Unitário com mock | Automatizado | Local | Engenharia | Teste de consumo e shutdown |
| Idempotência | Integração | Automatizado | Local | Engenharia | Teste de replay |
| Alertas concorrentes | Integração | Automatizado | Local | Engenharia | Teste de corrida |
| Health e métricas | Integração | Automatizado | Local | Engenharia | Testes de contrato |
| Segurança/redaction | Unitário e revisão | Automatizado + manual | Local | Segurança | Teste e inspeção de logs |
| Custo | Unitário | Automatizado | Local | Engenharia | Teste da guarda |
| Docker/rollback | Manual | Manual | Local | QA | Registro de execução |
| Azure real | Integração opt-in | Manual | Azure | Responsável do projeto | Evidência somente se autorizado |

## Rastreabilidade dos critérios de aceitação

| Critério | Risco | ID/caminho do teste automatizado | Caso de teste manual | Evidência/resultado | Defeito/exceção |
|---|---|---|---|---|---|
| AC-001 | R-007 | `services/simulator/tests/*`, `services/api/tests/*` | Subir stack local e verificar dashboard | Parcial: simulador, API e dashboard verdes; stack Docker manual pendente | — |
| AC-002 | R-007 | `services/simulator/tests/sensorFactory.test.js` | Inspecionar 8 sensores | Pass — TASK-009-01 | — |
| AC-003 | R-007 | `services/simulator/tests/config.test.js`, `services/simulator/tests/publishers/createPublisher.test.js`, `services/api/tests/unit/config/azure.test.js`, `services/api/tests/unit/index.test.js` | Alternar flag e observar publisher/ingress | Pass — TASK-009-02 e TASK-009-04 | — |
| AC-004 | R-001, R-004 | `services/simulator/tests/publishers/azureIotHubPublisher.test.js` | Revisar mensagem no mock | Pass — TASK-009-02 | — |
| AC-005 | R-006 | `services/simulator/tests/simulator.test.js` | Enviar SIGTERM | Pass — TASK-009-01 | — |
| AC-006 | R-007 | `services/api/tests/integration/telemetryProcessor.test.js` | Comparar resultados dos ingress | Pass — TASK-009-03 | — |
| AC-007 | R-005 | `services/api/tests/unit/ingress/azureEventHubsIngress.test.js`, `services/api/tests/unit/index.test.js` | Iniciar API em modo Azure mockado | Pass — TASK-009-04 | — |
| AC-008 | R-002 | `services/api/tests/integration/telemetryProcessor.test.js` | Reentregar evento | Pass — TASK-009-03 | — |
| AC-009 | R-003 | `services/api/tests/integration/telemetryProcessor.test.js` | Executar criação concorrente | Pass — TASK-009-03 | — |
| AC-010 | R-005 | `services/api/tests/integration/routes/health.test.js` | Consultar health nos dois modos | Pass — TASK-009-04 | — |
| AC-011 | R-004 | `services/simulator/tests/redact.test.js`, `services/api/tests/unit/utils/redact.test.js` | Inspecionar logs e diff | Pass — simulador e API | — |
| AC-012 | R-001 | `services/simulator/tests/azureBudget.test.js` | Iniciar acima do orçamento | Pass — TASK-009-02 | — |
| AC-013 | R-007 | N/A — manual | Subir local, alternar e voltar | Parcial — stack segura local healthy; troca Azure e rollback real pendentes | — |
| AC-014 | R-007 | `npm test` nos três serviços | Revisar QA-009 | Pass nos testes automatizados; Docker seguro e Azure real pendentes | — |
| AC-015 | R-008 | N/A — revisão de diff | Revisar contratos e arquivos | Parcial — compose local e contratos preservados; revisão final pendente | — |

Nenhum critério pode permanecer sem evidência ou sem um motivo aprovado de não
aplicável. Nesta fase, AC-002 a AC-012 e AC-014 têm evidência automatizada;
AC-001, AC-013 e AC-015 ainda dependem de stack Docker, teste manual ou revisão
final de diff.

## Ambiente e dados

- **Ambiente e URL/endpoint:** local; API em `http://localhost:3000`, dashboard
  conforme compose local; Azure real somente se autorizado.
- **Build/commit/configuração:** working tree local sem commit; testes em Node.js
  24.0.0; imagens Docker em Node.js 22 construídas e stack segura local validada.
- **Feature flags:** `TELEMETRY_TRANSPORT=local|azure`;
  `AZURE_IOT_REAL_TESTS=false` por padrão.
- **Dependências ou versões de serviço:** Node.js 22 no CI/Docker; versões Azure
  fixadas no lockfile.
- **Contas, funções e permissões:** nenhuma conta Azure necessária para testes
  com mocks; teste real exige autorização e menor privilégio.
- **Dados:** fixtures determinísticas; nenhum dado pessoal ou de produção;
  limpar `ProcessedMessage` e alertas de teste entre execuções.
- **Observabilidade:** logs estruturados, `/health`, `/metrics` e inspeção de
  redaction.

## Matriz de compatibilidade

| Plataforma/navegador/dispositivo | Versão | Área de visualização/entrada | Prioridade | Resultado/evidência |
|---|---|---|---|---|
| Node.js | 22 | Serviços | Alta | Pass — imagens `prod` construídas e stack segura local healthy |
| Node.js | 24 | Desenvolvimento local | Média | Pass — testes dos três serviços |
| Docker Compose | Versão local | Stack local | Alta | Pendente |
| Mosquitto | Configuração atual | Modo local | Alta | Pendente |
| Dashboard | Build atual | Regressão visual/funcional | Alta | Pass — 59 testes |

## Critérios de entrada (Entry criteria)

- [x] A SPEC-009 e o ADR-008 estão aprovados.
- [x] As decisões abertas foram resolvidas.
- [ ] As TASKs estão em `Ready` e atribuídas.
- [x] O build pode ser executado no ambiente local.
- [x] Fixtures e automação podem ser revisadas.
- [x] Limitações conhecidas e dependências estão divulgadas.

## Critérios de saída (Exit criteria)

- [ ] Critérios de aceitação têm evidência de aprovação.
- [ ] Automação e regressão exigidas foram aprovadas.
- [ ] Verificações manuais e não-funcionais aplicáveis foram aprovadas.
- [ ] Não há defeito S1 ou S2 aberto.
- [ ] Defeitos e riscos restantes têm disposição explícita.
- [ ] Revisões de segurança e código estão completas.
- [ ] Nenhum segredo foi encontrado em logs, testes ou diff.

## Defeitos e riscos residuais

| ID | Severidade | Resumo | Status | Responsável | Disposição para lançamento |
|---|---|---|---|---|---|
| R-009 | Baixa | Avisos moderados transitivos de `uuid`/`@azure/core-http` no SDK Azure | Aberto | Engenharia | Sem caminho de execução no `sendEvent`; revisar atualização do SDK |

## Exceções de portão (Gate exceptions)

| Portão/verificação | Motivo e impacto | Mitigação/monitoramento | Responsável | Validade (Expiry) | Aprovador |
|---|---|---|---|---|---|
| Teste real no Azure | Sem autorização e sem recurso provisionado | Validar com mocks; teste real opt-in | Responsável do projeto | Até autorização | Responsável do projeto |
| Checkpoint com Blob | Custo e recurso adicional | Deduplicação durável; documentar replay | Engenharia | Enquanto a SPEC-009 vigorar | Responsável do projeto |

## Resumo do teste e recomendação

- Executados/aprovados/falhos/bloqueados: TASK-009-01 a TASK-009-04
  concluídas; TASK-009-05 em andamento para stack segura, rollback e QA final.
- Evidência principal: 76 testes do simulador, 255 da API e 59 do dashboard;
  cobertura da API em 93,32% statements, 85,95% branches, 95,56% functions e
  95,07% lines; cobertura do simulador em 97,79% statements, 92,42% branches,
  92,3% functions e 98,64% lines.
- Limitações conhecidas: at-least-once; sem checkpoint store; sem teste real no
  Azure nesta fase; stack Docker manual não executada; X.509 e Event Hubs reais
  pendentes.
- Recomendação: No-go para a SPEC completa; TASK-009-01 a TASK-009-04 aprovadas
  com ressalvas.
- Responsável de QA e timestamp: Engenharia, 2026-10-23.
