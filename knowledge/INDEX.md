# Índice da Base de Conhecimento

Metadados de recuperação seletiva. Este índice não substitui `PROJECT.md`,
SPECs, ADRs ou padrões; ele indica qual módulo consultar e em que contexto.

| Módulo | Conteúdo | Carregar quando |
|---|---|---|
| [`architecture/overview.md`](architecture/overview.md) | Componentes, fluxo de dados e princípios arquiteturais | A mudança afetar limites entre serviços, MQTT, API ou persistência |
| [`business/domain.md`](business/domain.md) | Entidades de negócio, sensores, leituras, alertas e thresholds | A mudança alterar regras de domínio ou terminologia |
| [`decisions/log.md`](decisions/log.md) | Decisões que não possuem ADR formal | For necessário entender escolhas históricas |
| [`glossary/terms.md`](glossary/terms.md) | Glossário de termos técnicos e de domínio | Houver ambiguidade de vocabulário |
| [`integrations/mqtt.md`](integrations/mqtt.md) | Broker, tópicos, payloads e autenticação MQTT | A mudança envolver publicação ou consumo MQTT |
| [`patterns/patterns.md`](patterns/patterns.md) | Fluxo de eventos, camadas e padrões de projeto | A mudança precisar seguir convenções existentes |
| [`stack/technologies.md`](stack/technologies.md) | Tecnologias, versões e justificativas da stack | A mudança introduzir, remover ou atualizar dependências |

## Regras

- Carregue apenas os módulos nomeados pela SPEC ativa ou por um risco material
  documentado.
- Registre a exceção quando contexto adicional for necessário.
- Não use este índice como justificativa para carregar toda a base.
