# Baseline OWASP ASVS 5.0.0 Level 2

**Status:** Refactor local em validação — nenhum requisito aplicável em `Fail`
**Data:** 2026-07-27
**Aprovação humana da baseline:** 2026-07-23 e 2026-07-27
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
| V6 | 12 | 0 | 23 | 35 |
| V7 | 14 | 0 | 4 | 18 |
| V8 | 6 | 0 | 1 | 7 |
| V9 | 7 | 0 | 0 | 7 |
| V10 | 0 | 0 | 29 | 29 |
| V11 | 10 | 0 | 4 | 14 |
| V12 | 7 | 0 | 2 | 9 |
| V13 | 13 | 0 | 0 | 13 |
| V14 | 9 | 0 | 0 | 9 |
| V15 | 12 | 0 | 1 | 13 |
| V16 | 16 | 0 | 0 | 16 |
| V17 | 0 | 0 | 7 | 7 |
| **Total** | **151** | **0** | **102** | **253** |

Todos os 102 itens `N/A` foram avaliados por ID. Eles correspondem a mecanismos
ausentes do produto, como upload de arquivos, OAuth/OIDC e WebRTC; nenhuma
conexão ou controle existente foi classificado como não aplicável.
`V12.2.2` é o único item reclassificado por mudança explícita do limite de
confiança: não existe serviço voltado ao exterior no alvo exclusivamente local.

## 4. Reavaliação do escopo operacional

O ciclo aprovado corrigiu 32 dos 34 requisitos originalmente em `Fail`.
Autenticação e sessão, autorização/token, política criptográfica, TLS interno,
identidades X.509, classificação de dados, SLA de vulnerabilidades e
centralização protegida de logs possuem controle, teste e evidência individual
na matriz CSV.

Em 2026-07-27, o responsável humano removeu deploy público e remoto do escopo:

- `v5.0.0-V12.2.2` passou a `N/A`, pois o texto oficial se restringe a serviços
  external-facing e o alvo usa apenas `localhost`;
- `v5.0.0-V13.3.1` passou a `Pass`: a solução local gera secrets e PKI
  aleatórios fora do Git, restringe o diretório temporário, entrega material
  por Docker secrets e o destrói junto aos volumes no teardown.

Essa decisão não aprova um deploy real. Qualquer exposição externa futura exige
nova SPEC, certificado público e gestor operacional de secrets.

## 5. Evidências operacionais

- API: 188 testes, 31 suites e cobertura acima do gate.
- Dashboard: 59 testes e build aprovado.
- Simulator: 28 testes e cobertura acima do gate.
- Stack isolada: TLS externo e interno, mTLS, autenticação, ACL, identidades
  X.509, seis streams de log e isolamento de portas/volumes validados.
- Trivy/ZAP: nenhuma vulnerabilidade high/critical nas três imagens e nenhum
  alerta high/medium/low no DAST.
- GitHub Actions: execução
  [`30111549157`](https://github.com/ElessandroPrestes/iot-mqtt-simulator/actions/runs/30111549157)
  com os dez jobs obrigatórios em `success`: testes/builds/audits, CodeQL,
  Gitleaks, imagens/SBOM, observabilidade mTLS, ZAP e gate consolidado.

O advisory moderate da API foi eliminado com a remoção da dependência `uuid`.
O advisory raiz de `echarts`/`vue-echarts` não viola o gate aprovado de
`high`/`critical` e possui owner, prazo de 2026-08-23 e plano de upgrade major
em `vulnerability-management.md`.

## 6. Gates

- [x] Fonte estável e hash registrados.
- [x] Inventário Level 1/2 contado por capítulo.
- [x] 253 requisitos triados individualmente.
- [x] Todo `Pass` possui controle, teste e evidência.
- [x] Todo `N/A` possui justificativa individual.
- [x] Nenhum requisito aplicável permanece `Fail`.
- [x] Itens `N/A` possuem decisão de escopo e owner.
- [x] Baseline revisada por humano.
