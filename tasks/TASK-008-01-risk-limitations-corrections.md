# TAREFA (TASK): Correção das informações de riscos, limitações e rastreabilidade

## Metadados

| Campo | Valor |
|---|---|
| ID | TASK-008-01 |
| Status | Done (Concluído) |
| Responsável | Documentação e Engenharia |
| Refs: | SPEC: SPEC-008; Critérios de aceitação: AC-001, AC-002, AC-003, AC-004, AC-005; ADRs: N/A — sem mudança arquitetural |
| Dependências | Nenhuma |

## Objetivo

Corrigir as informações de riscos e limitações e remover lacunas falsas da
matriz de rastreabilidade, sem alterar o comportamento do produto.

## Escopo

### Incluído

- `PROJECT.md` — registro de riscos e limitações.
- `CHANGELOG.md` — status real da versão 1.0.0.
- `ROADMAP.md` — estado da compatibilidade de identificadores.
- `docs/ids-and-traceability.md` — regra de compatibilidade.
- `scripts/generate_traceability.py` — suporte a identificadores históricos.
- `.gitignore` — ignorar cache Python gerado pela ferramenta.
- `docs/traceability-matrix.md` — regeneração.
- `reviews/REVIEW-TASK-008-01-risk-limitations.md` — evidência de revisão.

### Excluído

- Código dos serviços, testes de produto, acessibilidade, retry MQTT, paginação
  e thresholds por sensor.
- Tag, release, merge em `main` ou deploy.

## Abordagem e impacto

- Prováveis arquivos ou componentes: os listados no escopo.
- Dados, contratos ou migrações: nenhum.
- Riscos e salvaguardas: preservar os formatos históricos e não inferir vínculos
  ausentes.
- ADRs e padrões aplicáveis: `docs/ids-and-traceability.md`,
  `standards/quality-gates.md`.

## Etapas (Steps)

- [x] Corrigir a seção 15 do `PROJECT.md`.
- [x] Corrigir a versão 1.0.0 no `CHANGELOG.md`.
- [x] Atualizar `ROADMAP.md` e `docs/ids-and-traceability.md`.
- [x] Ajustar o gerador de rastreabilidade e ignorar cache Python.
- [x] Regenerar a matriz e inspecionar as lacunas.
- [x] Registrar revisão e evidências.

## Validação

| Critério/risco | Teste, comando, ou revisão | Evidência esperada |
|---|---|---|
| AC-001 | Inspeção da seção 15 do `PROJECT.md` | Tabela com impacto, escopo e tratamento |
| AC-002 | Comparação com `tasks/TASK-013-changelog-release-v1.md` | Versão 1.0.0 declarada como local e não publicada |
| AC-003 | `python3 scripts/generate_traceability.py` | Tarefas históricas reconhecidas |
| AC-004 | Inspeção de `docs/traceability-matrix.md` | Sem lacunas falsas para tarefas com SPEC |
| AC-005 | Inspeção de `ROADMAP.md` e `docs/ids-and-traceability.md` | Compatibilidade documentada |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis foram aprovados.
- [x] A documentação e rastreabilidade estão atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças feitas: `PROJECT.md`, `CHANGELOG.md`, `ROADMAP.md`,
  `docs/ids-and-traceability.md`, `scripts/generate_traceability.py` e
  `docs/traceability-matrix.md`.
- Evidência: execução do gerador e inspeção documental registradas em
  `reviews/REVIEW-TASK-008-01-risk-limitations.md`.
- Trabalho em aberto ou bloqueios (blockers): lacunas históricas reais
  permanecem no roadmap; release/tag/merge em `main` continuam fora do escopo.
