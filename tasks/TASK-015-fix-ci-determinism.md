# TASK-015 — Corrigir determinismo do CI/CD

## Status

🟡 **Em implementação**

## Fase

Correção crítica de CI/CD

## SPEC associada

[SPEC-007 — Correção determinística do CI/CD](../specs/SPEC-007-ci-determinism.md)

## Plano

1. Criar teste concorrente que reproduza a ultrapassagem do limite.
2. Implementar lock MongoDB com lease e ownership.
3. Atualizar o conjunto Vite/Vue/Vitest com versões compatíveis.
4. Agrupar o conjunto no Dependabot.
5. Executar `npm ci`, testes, cobertura, build e imagem Docker.
6. Revisar a aderência à SPEC-007 e refatorar se necessário.
7. Atualizar documentação, criar commit convencional e enviar à `main`.
8. Acompanhar o CI remoto até conclusão.

## Critérios

- [x] Uma única sessão é criada sob oito logins paralelos com limite 1.
- [x] Lock é liberado após sucesso e erro.
- [x] Dashboard instala, testa e constrói sem bypass de peer dependency.
- [x] CI local completo passa.
- [x] Review SDD aprovado para envio.
- [ ] Commit enviado à `main`.
- [ ] CI remoto verde.
