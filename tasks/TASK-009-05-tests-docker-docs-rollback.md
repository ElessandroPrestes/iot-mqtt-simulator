# TAREFA (TASK): Testes, Docker, documentação e rollback

## Metadados

| Campo | Valor |
|---|---|
| ID | TASK-009-05 |
| Status | In Progress (Em andamento) |
| Responsável | Engenharia e QA |
| Refs: | SPEC: SPEC-009; Critérios de aceitação: AC-013, AC-014, AC-015; ADRs: ADR-008 |
| Dependências | TASK-009-01, TASK-009-02, TASK-009-03, TASK-009-04 |

## Objetivo

Fechar a integração com evidências de QA, opção de execução Docker, documentação
operacional e rollback reproduzível para o modo local, sem expandir o escopo.

## Escopo

### Incluído

- Testes de regressão completos do simulador, API e dashboard.
- Testes de contrato do health e do payload compartilhado.
- Overlay Docker opcional para Azure, sem alterar o compose local.
- Documentação de configuração, secrets, custo, troubleshooting e rollback.
- Atualização de `PROJECT.md`, `CHANGELOG.md`, `README.md`, `.env.example` e
  matriz de rastreabilidade.
- Evidência de QA em `docs/qa/QA-009-azure-iot-hub.md`.
- Revisão de segurança de logs e segredos.
- Verificação de que dashboard, tópicos locais, payload e rotas existentes não
  foram alterados.

### Excluído

- Provisionamento ou teste real no Azure sem autorização.
- Release, tag, merge em `main` ou deploy remoto.
- Commit ou push sem autorização.
- Checkpoint com Blob Storage.
- Um dispositivo por sensor.

## Abordagem e impacto

- **Arquivos prováveis:** testes dos três serviços,
  `docker-compose.azure.yml` (opcional), `.env.example`, `README.md`,
  `PROJECT.md`, `CHANGELOG.md`, `docs/qa/QA-009-azure-iot-hub.md`,
  `docs/traceability-matrix.md`.
- **Dados, contratos ou migrações:** nenhuma migração nesta tarefa; o script da
  TASK-009-03 deve estar documentado.
- **Riscos e salvaguardas:** não alterar o compose local; não incluir segredos
  reais; não declarar teste real no Azure sem evidência; manter o rollback
  simples e testado.
- **ADRs e padrões aplicáveis:** ADR-008, `standards/quality-gates.md`,
  `standards/testing.md`, `standards/security.md`,
  `docs/ids-and-traceability.md`.

## Etapas (Steps)

- [x] Executar e registrar a regressão dos três serviços.
- [x] Adicionar/ajustar testes de contrato e de segurança.
- [x] Criar overlay Docker Azure opcional e documentar o uso.
- [x] Documentar configuração, secrets, custo e troubleshooting.
- [ ] Documentar e testar o rollback para `local`.
- [x] Atualizar documentos canônicos e a matriz de rastreabilidade.
- [ ] Preencher a evidência de QA e a revisão de escopo.

## Validação

| Critério/risco | Teste, comando, ou revisão | Evidência esperada |
|---|---|---|
| AC-013 | Subir modo local, alternar Azure mockado e voltar | Compose local intacto; rollback documentado |
| AC-014 | `npm test` nos três serviços + revisão do QA-009 | Todos os testes passam; ACs com evidência |
| AC-015 | `git diff` e revisão de contratos | Dashboard, tópicos, payload, Reading e rotas preservados |
| Segurança | Inspeção de logs, `.env.example` e diff | Nenhum segredo ou valor real |
| Rastreabilidade | `python3 scripts/generate_traceability.py` | SPEC, TASKs e ADR vinculados |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis foram aprovados.
- [ ] A documentação e rastreabilidade estão atualizadas.
- [ ] Limitações e desvios estão registrados.

## Resultado

- Mudanças feitas:
  - Overlay `docker-compose.azure.yml` criado sem alterar o compose local.
  - README com uso do overlay, secrets, health, troubleshooting e rollback.
  - `.env.example`, `PROJECT.md` e `CHANGELOG.md` atualizados.
  - Redaction da API ampliada para chaves/SAS do Azure.
  - Regressão e QA-009 atualizados.
- Evidência:
  - API: 41 suítes, 255 testes; simulador: 76 testes; dashboard: 59 testes.
  - `docker compose -f docker-compose.yml -f docker-compose.azure.yml config`
    validado (com `GF_SECURITY_ADMIN_PASSWORD` de teste), resultando em
    `TELEMETRY_TRANSPORT=azure` para API e simulador.
  - Build das imagens de desenvolvimento concluído; a API não ficou healthy
    porque o `.env` local não possui `JWT_SECRET`, requisito do perfil seguro
    (`make local-secure-up`). Containers e volumes do teste foram removidos.
  - `make local-secure-up` concluído na segunda tentativa; `GET /health` em
    `https://localhost:8443/health` retornou 200 com `transport: local`,
    MongoDB/MQTT `connected` e `azureEventHubs: disabled`.
  - Overlay também validado sobre `docker-compose.prod.yml` + secrets locais.
  - Stack segura encerrada com `make local-secure-down`, removendo volumes e
    secrets efêmeros.
- Trabalho em aberto ou bloqueios (blockers):
  - Validar a troca local → Azure → local com credenciais reais e registrar o
    rollback com evidência; a stack segura local já foi validada.
  - Primeira subida da stack segura falhou por MongoDB unhealthy e a segunda
    passou; investigar a intermitência antes de considerar o Docker estável.
  - Teste real no Azure continua opt-in e sem autorização/credenciais.
  - Revisão independente e AC-013/AC-015 ainda pendentes.
  - Sem push, tag ou release; o commit local desta entrega é registrado ao
    final da sessão.

## Próximos passos

1. Obter autorização e credenciais de teste do Azure IoT Hub/Event Hubs.
2. Executar a troca `local -> azure -> local` e registrar health, métricas,
   logs e ausência de perda/duplicação indevida.
3. Repetir a subida da stack segura para investigar a intermitência do MongoDB
   antes de considerar o perfil Docker estável.
4. Revisar o diff de AC-013/AC-015, criar a revisão independente e, se aprovado,
   marcar `TASK-009-05` como `Done`.
5. Regenerar a matriz de rastreabilidade e atualizar o QA final.
