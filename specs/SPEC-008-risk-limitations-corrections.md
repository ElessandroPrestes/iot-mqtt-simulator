# SPEC-008: Correção das informações de riscos, limitações e rastreabilidade

## Metadados

| Campo | Valor |
|---|---|
| ID | SPEC-008 |
| Status | Approved (Aprovado) |
| Responsável | Documentação e Engenharia |
| Revisores | Produto / Engenharia / QA |
| Criado | 2026-10-23 |
| Atualizado | 2026-10-23 |
| Liberação Alvo | Correção documental, sem release de produto |
| Refs: | Discovery: `reviews/REVIEW-PROJECT-LOCAL-SDD.md`; Design: N/A — correção documental e de ferramenta interna; ADRs: N/A — sem mudança arquitetural |

## Problema e resultado

As informações de riscos e limitações do projeto estão ambíguas ou incompletas:

- o `CHANGELOG.md` declara uma versão `1.0.0` com data, mas a `TASK-013`
  registra que tag, merge em `main` e release público ficaram fora do escopo
  local aprovado;
- a seção de limitações do `PROJECT.md` mistura restrições de produto,
  decisões de escopo e dívida documental sem impacto ou tratamento explícito;
- a matriz de rastreabilidade reporta lacunas falsas porque o gerador não
  reconhece os identificadores históricos `TASK-NNN`, usados antes da adoção do
  formato canônico `TASK-NNN-XX`.

Resultado desejado: riscos e limitações registrados com impacto, escopo e
tratamento; rastreabilidade histórica reconhecida sem inferência; nenhuma
afirmação de release não executado.

## Escopo

### No escopo

- Reclassificar as limitações em `PROJECT.md` com impacto, estado e tratamento.
- Corrigir a declaração de versão/release no `CHANGELOG.md`.
- Tornar o gerador de rastreabilidade compatível com `TASK-NNN` histórico e
  `TASK-NNN-XX` canônico.
- Ignorar o cache Python gerado pela ferramenta no controle de versão.
- Regenerar `docs/traceability-matrix.md`.
- Atualizar `ROADMAP.md` e `docs/ids-and-traceability.md` com a regra de
  compatibilidade.
- Registrar evidência de revisão documental.

### Fora do escopo

- Implementar correções de acessibilidade, retry MQTT, paginação por cursor ou
  thresholds por sensor.
- Criar tag, executar release, fazer merge em `main` ou deploy.
- Alterar comportamento de produto ou código dos serviços.

## Comportamento funcional

- Cada limitação deve informar o impacto observável, o escopo em que se aplica
  e o tratamento ou próximo passo.
- O `CHANGELOG.md` não pode apresentar uma versão como publicada quando não
  houve tag ou release.
- O gerador deve reconhecer identificadores históricos e canônicos sem inventar
  vínculos ausentes.
- Lacunas reais devem permanecer listadas; lacunas falsas devem desaparecer.

## Requisitos não-funcionais

- Segurança e privacidade: não expor segredos ou dados pessoais.
- Desempenho e capacidade: geração da matriz em tempo linear sobre os artefatos.
- Confiabilidade e recuperação: a geração deve falhar de forma explícita quando
  o histórico Git não estiver disponível.
- Acessibilidade: N/A — sem alteração de interface.
- Compatibilidade: preservar os formatos históricos já versionados.
- Observabilidade: a matriz deve indicar claramente as lacunas remanescentes.

## Critérios de aceitação

### AC-001

```yaml
id: AC-001
title: Limitações com impacto, escopo e tratamento
preconditions:
  - PROJECT.md disponível
action: Revisar a seção 15 de PROJECT.md
expected_result: Cada limitação possui impacto, escopo e tratamento ou próximo passo explícitos
evidence_type: manual
```

### AC-002

```yaml
id: AC-002
title: Release não executado não é apresentado como publicado
preconditions:
  - CHANGELOG.md e TASK-013 disponíveis
action: Comparar a declaração de versão do CHANGELOG.md com o status da TASK-013
expected_result: O CHANGELOG.md informa que a versão 1.0.0 é local e não publicada, sem tag ou release
evidence_type: manual
```

### AC-003

```yaml
id: AC-003
title: Gerador reconhece identificadores históricos e canônicos
preconditions:
  - Tarefas com TASK-NNN e TASK-NNN-XX existentes
action: Executar scripts/generate_traceability.py
expected_result: Tarefas históricas e canônicas são reconhecidas e vinculadas às SPECs referenciadas
evidence_type: automated
```

### AC-004

```yaml
id: AC-004
title: Matriz regenerada sem lacunas falsas
preconditions:
  - AC-003 implementado
action: Inspecionar docs/traceability-matrix.md
expected_result: Não há lacuna para tarefa que referencia SPEC existente; lacunas reais permanecem listadas
evidence_type: automated
```

### AC-005

```yaml
id: AC-005
title: Documentação de compatibilidade e roadmap atualizada
preconditions:
  - ROADMAP.md e docs/ids-and-traceability.md disponíveis
action: Revisar os documentos
expected_result: A compatibilidade com TASK-NNN histórico está documentada e o roadmap reflete o estado real
evidence_type: manual
```

## Abordagem técnica

- Atualizar `TASK_PATTERN` no gerador para aceitar `TASK-\d{3}` e
  `TASK-\d{3}-\d{2}`.
- Adicionar extração de status a partir da seção `## Status` quando não houver
  tabela de metadados.
- Reescrever a seção 15 do `PROJECT.md` como registro de riscos e limitações.
- Corrigir o cabeçalho e a nota da versão `1.0.0` no `CHANGELOG.md`.
- Regenerar a matriz e revisar as lacunas remanescentes.

## Entrega e operações

- Plano de implantação: commit documental na branch `develop`.
- Plano de migração: N/A — sem migração de dados.
- Plano de rollback: reverter o commit documental.
- Monitoramento e alertas: N/A — sem runtime alterado.

## Riscos e dependências

| Risco ou dependência | Impacto | Probabilidade | Mitigação | Responsável |
|---|---|---|---|---|
| Gerador reconhecer identificadores ambíguos | Vínculo incorreto | Baixa | Testar com tarefas históricas e canônicas | Engenharia |
| Matriz continuar com lacunas reais | Rastreabilidade incompleta | Média | Listar lacunas remanescentes e tratá-las no roadmap | Documentação |

## Questões abertas

| Questão | Responsável | Data limite | Resolução |
|---|---|---|---|
| Nenhuma | — | — | — |

## Aprovação

| Papel | Nome | Decisão | Data | Notas |
|---|---|---|---|---|
| Produto | Responsável do projeto | Approved | 2026-10-23 | Instrução explícita para corrigir riscos e limitações usando SDD |
| Design | N/A | N/A | 2026-10-23 | Sem alteração de interface |
| Engenharia | Responsável do projeto | Approved | 2026-10-23 | Correção documental e de ferramenta interna |
| QA | Engenharia | Ready | 2026-10-23 | Validação por execução do gerador e inspeção documental |
