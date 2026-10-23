# Universal SDD Framework (USF)

> 🚧 **Status:** Em desenvolvimento ativo. O framework evolui continuamente até a versão 1.0 e sua API documental ainda pode mudar.
>
> **Snapshot adotado neste repositório:** pré-1.0, atualizado em 2026-10-23.

Framework universal para aplicar **Spec-Driven Development (SDD)** em qualquer projeto de software, utilizando pessoas e agentes de IA de forma organizada, previsível e auditável.

---

## O que é o Universal SDD?

O Universal SDD (USF) é um framework open source para desenvolvimento orientado por especificações (Spec-Driven Development).

Seu objetivo é transformar requisitos aprovados em implementação rastreável, criando um processo reutilizável para qualquer linguagem, arquitetura ou ferramenta de IA.

O framework utiliza três fontes complementares:

- a **SPEC aprovada** define o comportamento desejado de uma mudança;
- o **PROJECT.md** registra o estado canônico do projeto;
- o **código e as evidências de QA** demonstram o comportamento implementado.

Qualquer divergência entre essas fontes deve ser tratada como defeito, mudança de escopo ou dívida documental — nunca resolvida silenciosamente.

O framework é independente de:

- linguagem de programação;
- framework;
- arquitetura;
- plataforma;
- provedor de IA.

## Por que este projeto existe?

Ferramentas de IA aceleram o desenvolvimento, mas sem um processo consistente é comum ocorrer:

- expansão de escopo;
- requisitos inventados;
- alterações fora do objetivo;
- documentação inconsistente;
- perda de contexto entre sessões;
- dificuldade para revisar decisões.

O Universal SDD organiza todo o ciclo de desenvolvimento através de especificações, tarefas, revisões e documentação versionada.

## Como funciona?

```text
Ideia
  ↓
Discovery de Produto e UX
  ↓
Arquitetura
  ↓
UX/UI Design
  ↓
Aprovação do Design
  ↓
SPEC técnica e funcional
  ↓
Aprovação Humana
  ↓
TASK
  ↓
Implementação
  ↓
QA automatizado e manual
  ↓
Design Review e Code Review
  ↓
Refatoração (se necessário)
  ↓
Documentação
  ↓
Release
```

## Compatibilidade

| Dimensão | Exemplos |
|---|---|
| Linguagens | PHP, Java, C#, Go, Python, JavaScript, TypeScript, Kotlin, Swift, Rust e outras |
| Frameworks | Laravel, Symfony, Spring, .NET, Express, NestJS, Next.js, React, Angular, Vue, Flutter, React Native e outros |
| Ferramentas de IA | ChatGPT, Codex, Claude Code, Gemini, GitHub Copilot, Cursor, Windsurf, Aider |

## Estrutura do framework

```text
Universal-SDD/

README.md
PROJECT.md
AGENTS.md
CLAUDE.md
GEMINI.md
COPILOT.md

agents/
workflows/
profiles/
knowledge/
standards/
templates/
specs/
tasks/
reviews/
adr/
docs/
```

## Documentação

| Documento | Objetivo |
|---|---|
| `README.md` | Visão geral do framework |
| `PROJECT.md` | Estado canônico atual do projeto |
| `UNIVERSAL_SDD_FRAMEWORK.md` | Definição normativa do núcleo |
| `AGENTS.md` | Protocolo comum para pessoas e agentes de IA |
| `docs/getting-started.md` | Primeiros passos |
| `docs/architecture.md` | Arquitetura do framework |
| `docs/agents.md` | Papéis e responsabilidades dos agentes |
| `docs/workflows.md` | Fluxos oficiais |
| `docs/knowledge-base.md` | Base de conhecimento |
| `docs/bootstrapping.md` | Inicialização de novos projetos |
| `docs/governance.md` | Regras e governança |
| `docs/best-practices.md` | Boas práticas |
| `docs/faq.md` | Perguntas frequentes |
| `docs/context-budget.md` | Orçamento de contexto por fase |
| `docs/ids-and-traceability.md` | Identificadores e rastreabilidade |
| `CONTRIBUTING.md` | Como contribuir |
| `CHANGELOG.md` | Histórico de versões |
| `ROADMAP.md` | Evolução planejada |
| `CODE_OF_CONDUCT.md` | Código de conduta |
| `standards/ux-ui.md` | Processo e critérios de UX/UI |
| `standards/design-system.md` | Tokens, componentes e governança visual |
| `standards/accessibility.md` | Requisitos e validações de acessibilidade |
| `standards/testing.md` | Estratégia de testes e evidências |
| `standards/quality-gates.md` | Critérios de entrada, saída e release |
| `workflows/feature.md` | Fluxo completo de uma funcionalidade |
| `agents/` | Missões, responsabilidades e limites dos papéis |
| `templates/` | Artefatos executáveis de especificação, design, tarefas, testes e revisão |

---

# Princípios

1. A SPEC aprovada define o comportamento desejado da mudança.
2. O `PROJECT.md` registra o estado canônico do projeto.
3. Código e evidências de QA comprovam o comportamento entregue.
4. Toda implementação começa por uma SPEC.
5. Interfaces começam por discovery e design aprovados antes da implementação.
6. Toda SPEC precisa de aprovação humana.
7. A IA implementa apenas o escopo aprovado.
8. Toda implementação deve passar pelos quality gates aplicáveis.
9. Mudanças de interface exigem revisão de design e acessibilidade.
10. Mudanças arquiteturais geram ADRs.
11. A documentação evolui junto com o código.
12. Divergências entre SPEC, `PROJECT.md`, código e evidências são tratadas explicitamente como defeito, mudança de escopo ou dívida documental — nunca silenciosamente.

---

# PROJECT.md

O estado canônico do projeto.

Deve conter:

- Visão geral do projeto
- Domínio de negócio
- Arquitetura
- Stack
- Versões
- Dependências
- Estrutura de pastas
- Runtime
- Variáveis de ambiente
- APIs
- Segurança
- Convenções de experiência do usuário e interface
- Design system e linha de base de acessibilidade
- Estratégia de testes e quality gates (portões de qualidade)
- CI/CD
- Implantação
- Padrões de codificação
- Limitações conhecidas
- Tecnologias intencionalmente NÃO utilizadas

Para uma mudança ativa, a SPEC aprovada é a linha de base de aceitação. Após a mudança ser aceita, o código, PROJECT.md e evidências de QA devem estar alinhados. Uma divergência é registrada e resolvida como um defeito, mudança de escopo aprovada ou dívida de documentação; nunca deve ser ignorada silenciosamente.

---

# Arquivos de Entrada de IA

Cada arquivo específico para IA apenas redireciona para o PROJECT.md.

Exemplo:

```md
Leia PROJECT.md primeiro.

Depois identifique:

- Workflow ativo
- Agente atual
- Especificação relevante
- Tarefa relevante

Nunca inicie a implementação antes de lê-los.
```

---

# Agentes

## Discovery Agent (Agente de Descoberta)

Mapeia o código existente.

Produz:

- inventário do projeto
- documentação ausente
- riscos

Nunca modifica o código.

---

## UX Research Agent (Agente de Pesquisa de UX)

Descobre necessidades do usuário antes de as decisões de interface serem tomadas.

Produz:

- briefing de UX
- grupos de usuários e necessidades
- jornadas ou fluxos de tarefas
- suposições e questões de pesquisa
- riscos de usabilidade

Nunca inventa evidências de usuários. Suposições devem ser rotuladas e aprovadas.

---

## UX/UI Design Agent (Agente de Design de UX/UI)

Transforma necessidades de usuários aprovadas e requisitos de produtos em comportamentos de interface implementáveis.

Produz:

- fluxos de usuários
- wireframes ou protótipos quando necessário
- especificação de design e mapeamento de componentes
- comportamento responsivo e estados de interface
- anotações de acessibilidade

Nunca inicia a implementação e nunca ignora a aprovação humana do design.

---

## Architecture Agent (Agente de Arquitetura)

Define a arquitetura.

Produz:

- proposta de arquitetura
- ADRs
- impactos

Nunca escreve código de produção.

---

## Spec Agent (Agente de Especificação)

Cria especificações.

Produz:

- SPEC
- critérios de aceitação
- escopo
- fora do escopo

Deve fazer perguntas sempre que houver ambiguidade.

---

## Task Agent (Agente de Tarefas)

Divide a SPEC em tarefas executáveis.

Produz:

- ordem de implementação
- checklist de validação
- riscos

---

## Implementation Agent (Agente de Implementação)

Implementa apenas tarefas aprovadas.

Nunca expande o escopo.

---

## Testing Agent (Agente de Testes)

Cria ou atualiza:

- testes unitários
- testes de integração
- testes e2e

Segue `standards/testing.md` e registra evidências com base nos critérios de aceitação.

---

## QA Agent (Agente de QA)

É responsável pelo planejamento de qualidade baseado em risco e pela validação independente.

Produz:

- plano de QA e matriz de rastreabilidade
- evidências de testes manuais e exploratórios
- resultado de regressão
- relatórios de defeitos com severidade e prioridade
- recomendação de qualidade de liberação (release)

Não aceita silenciosamente quality gates reprovados ou riscos residuais.

---

## Accessibility Review Agent (Agente de Revisão de Acessibilidade)

Valida os requisitos de acessibilidade aplicáveis usando verificações manuais e automatizadas. Registra violações, evidências, impactos e exceções.

---

## Design Review Agent (Agente de Revisão de Design)

Compara a interface implementada com a especificação de design aprovada.

Verifica:

- layout e hierarquia visual
- uso de tokens e componentes
- comportamento responsivo
- conteúdo e estados de interação
- anotações de acessibilidade

Gera: Aprovado, Aprovado com ressalvas ou Rejeitado. Nunca edita código da aplicação ao atuar como revisor.

---

## Review Agent (Agente de Revisão)

Revisa a implementação.

Gera:

- Aprovado
- Aprovado com ressalvas
- Rejeitado

Nunca edita o código da aplicação.

---

## Refactor Agent (Agente de Refatoração)

Apenas corrige problemas identificados pelo Agente de Revisão.

Nunca cria novos recursos.

---

## Documentation Agent (Agente de Documentação)

Atualiza:

- PROJECT.md
- ADRs
- Knowledge Base (Base de Conhecimento)
- Specs
- Tasks (Tarefas)

---

## Release Agent (Agente de Release/Lançamento)

Valida a prontidão de liberação.

Verifica:

- build
- testes
- quality gates
- aprovações de design e acessibilidade quando aplicável
- documentação
- versão
- release notes (notas de versão)

---

# Knowledge Base (Base de Conhecimento)

Entradas em `knowledge/` podem ser organizadas por arquitetura, negócios, glossário, integrações, stack, padrões ou outra taxonomia definida pelo projeto adotante. Use `templates/knowledge-entry.md` e evite duplicar ADRs ou SPECs.

---

# Padrões (Standards)

```
standards/

coding.md
security.md
performance.md
testing.md
quality-gates.md
database.md
api.md
commits.md
accessibility.md
ux-ui.md
design-system.md
```

---

# Perfis (Profiles)

Predefinições de projeto reutilizáveis.

Exemplos:

- backend-api
- laravel
- symfony
- spring
- dotnet
- express
- nextjs
- react
- angular
- vue
- flutter
- react-native
- cli
- library
- monolith
- microservice

O perfil ativo define as validações, comandos e convenções.

---

# Templates

Modelos (templates) base fornecidos:

- `templates/spec.md`
- `templates/project.md`
- `templates/task.md`
- `templates/adr.md`
- `templates/rfc.md`
- `templates/review.md`
- `templates/ux-brief.md`
- `templates/user-flow.md`
- `templates/design-specification.md`
- `templates/usability-test-plan.md`
- `templates/qa-plan.md`
- `templates/test-case.md`
- `templates/regression-checklist.md`
- `templates/accessibility-checklist.md`
- `templates/design-review.md`
- `templates/bug-report.md`
- `templates/release-plan.md`
- `templates/deploy-plan.md`
- `templates/post-mortem.md`

Projetos adotantes podem estendê-los ou mapeá-los para templates canônicos em suas próprias ferramentas, preservando os metadados necessários e a rastreabilidade.

---

# Fluxo de Trabalho (Workflow)

Ideia

↓

Descoberta (Discovery) de Produto e UX

↓

Arquitetura

↓

Design de UX/UI (quando voltado ao usuário)

↓

Aprovação Humana de Design

↓

Especificação Técnica e Funcional

↓

Aprovação Humana

↓

Tarefas (Tasks)

↓

Implementação

↓

QA Automatizado e Manual

↓

Revisão de Acessibilidade (quando aplicável)

↓

Revisão de Design (quando voltado ao usuário)

↓

Revisão de Código (Code Review)

↓

Refatoração (se necessário)

↓

Documentação

↓

Lançamento (Release)

Revisões rejeitadas retornam para a implementação e as verificações aplicáveis de QA se repetem.
Qualquer mudança de escopo solicitada retorna à especificação e à aprovação humana.

---

# Regras Universais

- Nunca invente requisitos.
- Nunca pule a aprovação.
- Nunca modifique arquivos não relacionados.
- Nunca introduza dependências sem justificativa.
- Cada funcionalidade deve ter:
  - SPEC
  - TASK
  - REVIEW
- Toda mudança voltada ao usuário também deve ter:
  - Briefing de UX ou um motivo explícito do porquê não é necessário
  - especificação de design aprovada
  - revisão de design
  - evidências de acessibilidade
- Toda alteração deve satisfazer os portões de qualidade (quality gates) aplicáveis antes da liberação.
- Critérios de aceitação devem ser rastreáveis nas evidências de testes.
- Portões falhos e riscos residuais exigem uma exceção explícita humana com proprietário e data de validade.
- Toda mudança arquitetural deve criar um ADR.
- Toda implementação relevante atualiza o PROJECT.md.
- A documentação e as evidências se alinham com a implementação aceita.

---

# Inicializando (Bootstrapping) um Novo Projeto

Quando este framework é copiado para um repositório, a primeira IA deve:

1. Inventariar o repositório de forma seletiva, seguindo `docs/context-budget.md`.
2. Preencher o PROJECT.md a partir do código existente.
3. Detectar tecnologias automaticamente.
4. Detectar a arquitetura.
5. Detectar o gerenciador de pacotes/sistema de build.
6. Detectar a estratégia de testes.
7. Detectar o design system e as convenções de interface.
8. Detectar a linha de base de acessibilidade.
9. Definir os quality gates aplicáveis.
10. Preencher a Knowledge Base (Base de Conhecimento).
11. Criar ADRs ausentes se necessário.
12. Sugerir melhorias, mas nunca aplicá-las sem aprovação.
13. Aguardar os artefatos de descoberta, design e especificação aprovados, conforme aplicável.

Neste ponto, o repositório é considerado pronto para SDD (SDD-ready).

---

# Primeiros Passos

1. Copie a estrutura do Universal SDD para seu projeto.
2. Solicite à IA que inventarie o repositório de forma seletiva.
3. Gere automaticamente o `PROJECT.md`.
4. Identifique arquitetura, stack e padrões.
5. Preencha a Base de Conhecimento.
6. Defina os padrões de UX/UI, acessibilidade, testes e quality gates aplicáveis.
7. Aguarde discovery, design e SPEC aprovados antes de implementar uma interface.

---

# Roadmap resumido

O planejamento detalhado e seu status são mantidos em [`ROADMAP.md`](ROADMAP.md).
