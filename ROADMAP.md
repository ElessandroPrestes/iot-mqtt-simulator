# Roadmap

> Estado do projeto e da adoção do Universal SDD. Itens futuros só entram em
> execução após SPEC e TASK aprovadas.

## Estado atual

| Área | Estado | Evidência |
|---|---|---|
| Produto | v1.0.0 concluída no escopo local; sem tag ou release público | `PROJECT.md`, `CHANGELOG.md` |
| Framework SDD | Snapshot pré-1.0 de 2026-10-23 | `UNIVERSAL_SDD_FRAMEWORK.md` |
| Documentação | Estrutura e módulos do framework presentes | `docs/` |
| Padrões | UX/UI, design system, acessibilidade, testes e quality gates | `standards/` |
| Rastreabilidade | Gerador compatível com `TASK-NNN` e `TASK-NNN-XX`; lacunas reais listadas | `scripts/generate_traceability.py`, `docs/traceability-matrix.md` |
| Segurança | Baseline OWASP ASVS Level 2 no escopo local | `standards/security.md`, `specs/SPEC-006-owasp-security-hardening.md` |
| CI | Pipeline de qualidade e segurança | `.github/workflows/ci.yml` |

## Evolução do framework no projeto

### Concluído

- Estrutura de agentes, workflows, perfis, padrões e templates.
- Entradas dedicadas para Claude, Gemini e GitHub Copilot.
- Orçamento de contexto por fase.
- Convenção de identificadores e trailers de commit.
- Documentos de governança, boas práticas, FAQ e bootstrapping.
- Guia de contribuição, changelog, roadmap e código de conduta.

### Em manutenção

- Alinhamento contínuo entre `PROJECT.md`, código e evidências de QA.
- Correção das lacunas históricas reais: tarefas sem SPEC explícita ou sem
  trailer `Task-Ref`.
- Revisão dos documentos do framework a cada novo snapshot pré-1.0.

### Candidatos a mudança

Os itens abaixo são limitações conhecidas registradas em `PROJECT.md`. Eles não
estão aprovados e exigem SPEC, TASK e aprovação humana antes de qualquer
implementação:

- paginação cursor-based nas rotas de leitura;
- thresholds por sensor individual;
- retry persistente para mensagens MQTT perdidas;
- ampliação da cobertura automatizada do dashboard;
- autenticação no MongoDB em desenvolvimento;
- auditoria WCAG completa e verificação automatizada de acessibilidade;
- suporte a `prefers-reduced-motion` no dashboard.

## Fora do escopo atual

- deploy público ou remoto;
- tag `v1.0.0`, release público e merge em `main`;
- AWS IoT Core;
- GitHub Actions CD;
- Kubernetes;
- Kafka ou RabbitMQ.

Qualquer mudança nesse escopo exige um novo ciclo SDD, com revisão de
arquitetura, segurança e aprovação humana.
