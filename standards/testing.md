# Testing Standard (Padrão de Testes)

## Propósito

Definir uma estratégia de testes baseada em riscos que demonstre a conformidade com a SPEC aprovada e evite regressões. O tipo e a profundidade do teste dependem do impacto, não apenas do tamanho da implementação.

## Níveis de teste

- **Unitário (Unit):** regras de negócios isoladas, transformações e lógica de componentes.
- **Integração (Integration):** fronteiras como banco de dados, serviço, fila, sistema de arquivos ou integração de componentes.
- **Contrato (Contract):** compatibilidade entre consumidores e provedores implantados de forma independente.
- **Ponta a ponta (End-to-end):** jornadas críticas através do sistema implantado.
- **Manual/exploratório:** comportamento emergente, usabilidade, conteúdo, recuperação e riscos que a automação não cobre adequadamente.
- **Aceitação de usuário/negócio (UAT):** confirmação por partes interessadas autorizadas de que fluxos de trabalho essenciais aos negócios e os resultados de aceitação estão adequados para o uso.
- **Não funcional:** acessibilidade, segurança, desempenho, resiliência, compatibilidade e observabilidade quando aplicável.
- **Regressão visual:** contratos visuais estáveis para componentes e telas importantes, com linhas de base (baselines) revisadas e ambientes controlados.

Prefira o nível de teste confiável mais baixo que prove o comportamento. Não duplique todas as asserções em todos os níveis.

## Regras Específicas do Projeto (IoT Simulator)

### Backend API (services/api)
- Mínimo de 90% de cobertura (lines, functions, statements) e 85% de branches.
- Rotas testadas com `supertest`.
- Banco de dados em memória (`mongodb-memory-server`) para testes de integração.
- Comandos: `npm test`, `npm run test:coverage`.

### Dashboard Vue (services/dashboard)
- Vitest para testes unitários, cobrindo stores (Pinia) e helpers/composables.
- Componentes chave testados via `@vue/test-utils` e ambiente jsdom.
- Gate canônico: `npm test` e `npm run build`.

### Simulator (services/simulator)
- Jest com suporte a ES Modules (`npm test`).

## Plano de QA e rastreabilidade

Toda mudança material requer o `templates/qa-plan.md`. Cada critério de aceitação deve mapear para um ou mais dos seguintes itens:

- um identificador de teste automatizado;
- um caso de teste manual e registro de execução;
- um motivo aprovado pelo qual a validação não é aplicável.

O mapeamento deve incluir comportamento positivo, negativo, de permissão, erro, limites (boundary) e recuperação, quando relevante.

## Ambientes e dados de teste

Registre o ambiente, build ou commit, configuração, dependências, feature flags, contas e pré-requisitos de dados. Os dados de teste devem ser determinísticos, seguros do ponto de vista de privacidade, isolados e recuperáveis. Nunca copie dados confidenciais de produção sem um processo aprovado e em conformidade.

## Regressão e compatibilidade

Use `templates/regression-checklist.md` para selecionar jornadas, integrações, plataformas, navegadores, dispositivos, idiomas e tecnologias assistivas afetadas. O escopo de regressão deve seguir a análise de impacto; “apenas arquivos modificados” não é suficiente.

## Confiabilidade

Um teste só é útil quando seu resultado é repetível e diagnosticável. Um teste intermitente (flaky test) deve ser registrado com um proprietário e alvo de correção. A quarentena requer uma exceção aprovada e cobertura de substituição; novas tentativas silenciosas (silent retries) não devem ocultar uma falha.

## Cobertura

Projetos podem definir limiares numéricos de cobertura, mas a cobertura de linhas por si só não é um quality gate. A cobertura exigida inclui riscos críticos, critérios de aceitação, regras de negócios, falhas e fronteiras de integração.

## Defeitos

Use `templates/bug-report.md`.

A severidade descreve o impacto no usuário ou sistema:

- **S1 Crítico:** incidente de segurança, interrupção generalizada, perda irreversível de dados ou jornada crítica bloqueada sem solução de contorno.
- **S2 Alto:** grande função ou grupo de usuários bloqueado; solução de contorno é impraticável.
- **S3 Médio:** comportamento degradado com solução de contorno razoável.
- **S4 Baixo:** pequeno problema com impacto funcional limitado.

A prioridade descreve a ordem de reparo e é decidida separadamente da severidade.

## Evidências e resultados

A evidência deve incluir o build, ambiente, comando ou etapas, resultado, timestamp e logs, relatórios, capturas de tela, gravações ou links relevantes. O revisor deve ser capaz de reproduzir a conclusão sem depender de um contexto não documentado.

Para alterações com critérios de aceitação estruturados, a evidência de QA deve ser registrada usando `templates/QA_EVIDENCE_TEMPLATE.md` para habilitar a comparação estruturada pelo QA-Verifier antes da revisão.
