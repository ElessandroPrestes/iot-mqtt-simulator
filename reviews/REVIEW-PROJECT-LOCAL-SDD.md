# Review SDD — Projeto no escopo local

**Data:** 2026-07-27

**Resultado:** 🟢 **Approved**

**Ambiente aprovado:** estação local, sem deploy público ou remoto

## 1. Fluxo auditado

O encerramento respeitou o fluxo:

`Discovery → Architecture → Specification → Human Approval → Tasks →
Implementation → Testing → Review → Refactor → Documentation`

Release não foi executado porque a decisão humana excluiu deploy, merge em
`main` e tag. A `TASK-013` está fora do escopo aprovado, e não é uma pendência
do produto local.

## 2. Pendência encontrada e corrigida

A auditoria encontrou a `TASK-011` registrada de forma contraditória e o
endpoint `/api/docs` indisponível no perfil seguro local.

Correções revisadas:

- `SWAGGER_ENABLED` permanece `false` por padrão no Compose.
- O lifecycle `make local-secure-up` habilita Swagger explicitamente.
- O edge encaminha `/api/docs` para a API; quando a API não monta a rota, o
  comportamento continua fail-closed com `404`.
- OpenAPI contém todas as rotas versionadas, `bearerAuth` e os schemas
  `Reading`, `Alert`, `SuccessResponse` e `ErrorResponse`.
- O lifecycle reinicia o Nginx para aplicar sua configuração versionada.

## 3. Evidências

- Testes focados de deduplicação, repositório e segurança: 20/20.
- Testes de Swagger, configuração e topologia TLS: 15/15.
- Suíte API canônica final: 32 suítes, 192 testes, com 95,38% de linhas,
  97,36% de funções e 86,12% de branches.
- Dashboard: 59 testes e build Vite aprovados.
- Simulator: 28 testes aprovados.
- Swagger real: `GET https://localhost:8443/api/docs/` retornou `200`.
- Documento OpenAPI real expôs os quatro schemas obrigatórios.
- Stack local: 11 serviços em execução; serviços com healthcheck saudáveis.
- Matriz ASVS Level 2: 151 `Pass`, 102 `N/A`, zero `Fail`.

## 4. Riscos e itens não bloqueantes

- A cobertura ampla opcional do Dashboard permanece abaixo dos thresholds
  auxiliares do Vitest; o gate canônico documentado é testes + build.
- Retry persistente MQTT, paginação por cursor e thresholds por sensor são
  evoluções futuras sem SPEC aprovada para o escopo atual.
- AWS IoT Core, CD, deploy público, changelog, merge em `main` e tag `v1.0.0`
  permanecem fora do escopo.

## 5. Decisão

Não há requisito aplicável em aberto no escopo exclusivamente local. O projeto
está aprovado para execução local. Esta decisão não autoriza release, deploy,
certificação formal OWASP ou exposição externa.
