# Baseline OWASP ASVS 5.0.0 Level 2

**Status:** Triagem individual concluída — 34 requisitos aplicáveis em `Fail`
**Data:** 2026-07-24
**Aprovação humana da baseline:** 2026-07-23
**Nível-alvo:** Level 2  
**Escopo:** API, Dashboard, Socket.io e controles de infraestrutura dependentes

## 1. Fonte canônica

- Versão estável: OWASP ASVS 5.0.0.
- Fonte:
  [CSV oficial](https://github.com/OWASP/ASVS/raw/v5.0.0/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv)
- SHA-256 do CSV avaliado:
  `98c8fe911b9edb403af8ee05d3ce8201ecac2659e313b053890a62847cdcf680`
- Requisitos totais no CSV: 345.
- Requisitos Level 1 ou Level 2: 253.

Os identificadores devem ser citados como `v5.0.0-<req_id>`. A baseline não é
certificação e não considera um requisito atendido sem evidência reproduzível.

## 2. Estados

| Estado | Significado |
|---|---|
| Pass | Controle implementado, testado e com evidência |
| Fail | Controle ausente ou comprovadamente inseguro |
| N/A | Requisito não se aplica, com justificativa |

## 3. Resultado consolidado

A matriz canônica e auditável está em
[`asvs-5.0.0-level-2.csv`](asvs-5.0.0-level-2.csv). Ela contém exatamente uma
linha para cada requisito Level 1/2 e as colunas obrigatórias `Requirement`,
`Applicable`, `State`, `Justification`, `Control`, `Test`, `Evidence` e `Owner`.

| Capítulo | Pass | Fail | N/A | Total |
|---|---:|---:|---:|---:|
| V1 | 12 | 0 | 15 | 27 |
| V2 | 10 | 0 | 1 | 11 |
| V3 | 16 | 0 | 3 | 19 |
| V4 | 7 | 0 | 3 | 10 |
| V5 | 0 | 0 | 9 | 9 |
| V6 | 10 | 2 | 23 | 35 |
| V7 | 8 | 6 | 4 | 18 |
| V8 | 5 | 1 | 1 | 7 |
| V9 | 6 | 1 | 0 | 7 |
| V10 | 0 | 0 | 29 | 29 |
| V11 | 6 | 4 | 4 | 14 |
| V12 | 2 | 6 | 1 | 9 |
| V13 | 10 | 3 | 0 | 13 |
| V14 | 5 | 4 | 0 | 9 |
| V15 | 10 | 2 | 1 | 13 |
| V16 | 11 | 5 | 0 | 16 |
| V17 | 0 | 0 | 7 | 7 |
| **Total** | **118** | **34** | **101** | **253** |

Todos os 101 itens `N/A` foram avaliados por ID. Eles correspondem a mecanismos
ausentes do produto, como upload de arquivos, OAuth/OIDC e WebRTC; nenhuma
conexão ou controle existente foi classificado como não aplicável.

## 4. Bloqueios revelados pela triagem

Além dos cinco requisitos inicialmente citados no review, a análise individual
encontrou lacunas aplicáveis nos seguintes grupos:

- autenticação: palavras contextuais de senha e segundo fator;
- sessão: inatividade, concorrência, invalidação imediata do access token,
  revogação administrativa e autosserviço de sessões;
- autorização/token: matriz por campo e tipo/uso explícito do JWT;
- criptografia: lifecycle/inventário, crypto agility e parâmetros mínimos
  Argon2id;
- transporte: cipher suites, certificado público e TLS/CA internos;
- backend/secrets: identidades de curta duração, MongoDB sem conta root para a
  API e gestão operacional de secrets;
- dados: classificação, requisitos por nível e `Cache-Control: no-store`;
- supply chain: SLA de vulnerabilidades;
- logs: inventário, processador central, imutabilidade e separação lógica.

Esses 34 itens permanecem `Fail`. O owner aparece como
`Pendente decisão humana` porque nenhum risco foi aceito e o Refactor Agent não
pode atribuir exceções nem reduzir o nível-alvo.

## 5. Evidências operacionais

- API: 149 testes e cobertura acima do gate.
- Dashboard: 58 testes e build; o teste de WebSocket foi tornado independente
  da variável `VITE_WS_URL` no commit `1ddf3ee`.
- Simulator: 24 testes.
- Stack local: TLS externo, autenticação, ACL e isolamento de portas validados.
- Trivy/ZAP local: nenhuma vulnerabilidade high/critical nas imagens e nenhum
  alerta high/medium/low no DAST.
- GitHub Actions: execução
  [`30087971980`](https://github.com/ElessandroPrestes/iot-mqtt-simulator/actions/runs/30087971980)
  para CodeQL, Gitleaks, audits, testes, imagens, SBOM e DAST.

Achados moderate em `uuid` e `echarts`/`vue-echarts` não violam o gate aprovado
de `high`/`critical`, mas continuam sem SLA até a resolução de
`v5.0.0-V15.1.1`.

## 6. Gates

- [x] Fonte estável e hash registrados.
- [x] Inventário Level 1/2 contado por capítulo.
- [x] 253 requisitos triados individualmente.
- [x] Todo `Pass` possui controle, teste e evidência.
- [x] Todo `N/A` possui justificativa individual.
- [ ] Nenhum requisito aplicável permanece `Fail`.
- [ ] Exceções possuem aprovação, owner e prazo.
- [x] Baseline revisada por humano.
