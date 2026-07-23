# ADR-005 — Pipeline de Integração Contínua (CI) com GitHub Actions

**Data:** 2026-07-22  
**Status:** Aceito  
**Autores:** Equipe de desenvolvimento  

---

## Contexto

O projeto não possuía nenhum pipeline automatizado de CI. A integração contínua é mandatória para garantir que nenhuma mudança na `develop` ou `main` quebre testes, cobertura mínima ou o build de produção do dashboard.

---

## Decisão

Adotar **GitHub Actions** como plataforma de CI com um único workflow (`ci.yml`) composto por quatro jobs.

---

## Estrutura do Pipeline

```
Trigger: push / PR → develop | main

Jobs (paralelos):
├── api          → npm ci + npm run test:coverage (Jest + mongodb-memory-server)
├── simulator    → npm ci + npm test (Jest ESM)
├── dashboard    → npm ci + npm test + npm run build (Vitest + Vite)
└── ci-ok        → gate consolidado (required status check no GitHub)
```

---

## Justificativas

| Decisão | Motivo |
|---|---|
| **3 jobs paralelos** | Cada serviço tem ciclo de teste independente; paralelismo reduz tempo total de feedback |
| **mongodb-memory-server no CI** | Já usado no setup de testes da API; elimina necessidade de service container MongoDB, simplificando o YAML |
| **Node.js 20 LTS** | Versão recomendada no PROJECT.md para garantir paridade com ambiente de desenvolvimento |
| **`concurrency: cancel-in-progress`** | Cancela runs anteriores do mesmo PR; economiza minutos do GitHub Actions |
| **Job `ci-ok`** | Ponto único de verificação configurável como *required status check* nas branch protection rules do GitHub |
| **Artefato de cobertura API** | Relatório HTML/LCOV disponível por 7 dias para inspeção manual |
| **Build do dashboard apenas na `main`** | Evita publicar artefatos de feature branches que ainda estão em revisão |

---

## Consequências

- Todo PR para `develop` ou `main` obrigatoriamente executa os três suítes de teste antes de poder ser mergeado.
- A cobertura mínima da API (90% lines/functions, 85% branches) é verificada automaticamente pelo Jest.
- O job `ci-ok` pode ser adicionado como *required status check* em **Settings → Branches → Branch protection rules** no GitHub para bloquear merges quando CI falha.

---

## Alternativas Descartadas

| Alternativa | Motivo da rejeição |
|---|---|
| CD (deploy automático) | Fora do escopo definido pelo projeto — deploy é feito manualmente via Docker Compose |
| Service container MongoDB | Complexidade desnecessária; mongodb-memory-server já é a estratégia de testes do projeto |
| Matrix de versões Node.js | Projeto usa Node 20 LTS como padrão; testar múltiplas versões não acrescenta valor no momento |
