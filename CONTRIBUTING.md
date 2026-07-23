# Guia de Contribuição (CONTRIBUTING.md)

Obrigado por se interessar em contribuir com o **IoT MQTT Simulator**!

Este projeto adota o **Spec-Driven Development (SDD)**, o que significa que o código é uma consequência da especificação. Nenhuma feature deve ser implementada sem antes ser discutida e especificada no repositório.

## Fluxo de Contribuição

Para garantir a estabilidade do sistema, siga estes passos:

1. **Abra uma Issue:** Antes de codar, abra uma Issue descrevendo o problema (bug) ou a nova funcionalidade.
2. **Crie uma SPEC (Specification):** Para novas funcionalidades, crie um documento em `specs/` descrevendo os casos de uso, impacto na arquitetura e contratos das APIs ou funções. Use o template fornecido no projeto.
3. **Aprovação da SPEC:** Aguarde a validação técnica da equipe sobre a sua especificação.
4. **Crie uma Branch:**
   ```bash
   git checkout -b feat/nome-da-feature
   # ou
   git checkout -b fix/nome-do-bug
   ```
5. **Implemente o Código:**
   - Cumpra exatamente o que foi acordado na SPEC.
   - Adicione ou atualize testes unitários e de integração (Mantenha a cobertura >= 90%).
   - Se sua mudança impactar a infraestrutura, atualize o `docker-compose.yml`.
6. **Execute os Testes:**
   Garanta que a pipeline de CI passará:
   ```bash
   cd services/api && npm test
   # Ou utilize o Makefile se disponível
   ```
7. **Commit:**
   Use Conventional Commits (ex: `feat: adiciona paginacao na API`, `fix: corrige duplo parsing de payload`).
8. **Abra o Pull Request (PR):**
   - O PR deve referenciar a Issue original (ex: `Closes #42`).
   - O PR será validado pelo CI (GitHub Actions) e passará por Code Review.

## Padrões de Código
- Utilizamos **ESLint** e **Prettier**. Não faça commit de código não formatado.
- Mantenha a arquitetura em camadas (Controllers, Services, Repositories).
- Todas as rotas devem responder usando o `responseFormatter.js`.

Estamos felizes em ter você conosco!
