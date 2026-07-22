# 🏭 IoT MQTT Simulator

![Status: Ativo](https://img.shields.io/badge/Status-Active-brightgreen)
![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-blue)
![SDD: Ready](https://img.shields.io/badge/Spec--Driven--Development-Ready-blueviolet)

Plataforma fullstack de simulação e monitoramento IoT industrial em tempo real, baseada em microserviços e comunicação orientada a eventos (MQTT/WebSockets).

Este projeto é gerido rigorosamente através do **Universal SDD Framework (Spec-Driven Development)**, garantindo que o código, a arquitetura e a documentação evoluam em sincronia e sob supervisão contínua, tanto humana quanto de Inteligência Artificial.

---

## 🤖 Para Inteligências Artificiais

Se você é uma IA (Claude, Gemini, Copilot, etc.), **PARE AQUI**. 
Você **deve** ler os arquivos `PROJECT.md` e `AGENTS.md` na raiz deste repositório antes de propor qualquer implementação, analisar arquitetura ou modificar o código. Toda a sua instrução e o estado canônico do projeto residem lá.

---

## 🛠️ Tecnologias Principais

- **Broker:** Eclipse Mosquitto (MQTT v5)
- **Banco de Dados:** MongoDB 7.0 (Timeseries Collection com TTL)
- **API Backend:** Node.js (Express, Socket.io, prom-client)
- **Simulator:** Node.js (ESM, mqtt.js)
- **Frontend Dashboard:** Vue 3, Vite, Pinia, TailwindCSS, ECharts
- **Infraestrutura:** Docker & Docker Compose
- **Observabilidade:** Prometheus (Métricas) e Winston (Logs)

> 💡 *Consulte o `PROJECT.md` e o diretório `knowledge/stack/` para a lista detalhada e a justificativa arquitetural.*

---

## 🚀 Instalação e Execução Local

O projeto foi construído para ser executado nativamente em containers Docker, eliminando atritos com versões de Node.js e bancos de dados. A boa prática ditada pelo SDD é **manter os ambientes isolados**; portanto, nunca tente rodar os serviços soltos no Host para desenvolvimento, utilize sempre a orquestração oficial.

### Pré-requisitos
- [Docker](https://www.docker.com/products/docker-desktop/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado
- Git

### Passo a Passo

1. **Clone o Repositório:**
   ```bash
   git clone git@github.com:ElessandroPrestes/iot-mqtt-simulator.git
   cd iot-mqtt-simulator
   ```

2. **Configuração de Ambiente:**
   Copie o template de variáveis de ambiente. Em ambiente local, as credenciais padrão do `.env.example` já estão sincronizadas com o `docker-compose.yml`.
   ```bash
   cp .env.example .env
   ```

3. **Subindo a Infraestrutura (Dev):**
   Execute o build e levante todos os serviços em background. O Docker vai construir as imagens do Node.js (API, Dashboard e Simulator) e iniciar o Mosquitto e o MongoDB.
   ```bash
   docker compose up -d --build
   ```

4. **Verificando a Execução:**
   ```bash
   docker compose ps
   ```
   *Certifique-se de que os containers `iot_broker`, `iot_mongo`, `iot_api`, `iot_simulator` e `iot_dashboard` estejam com status "Up".*

5. **Acessando a Aplicação:**
   - **Dashboard (Vue.js):** [http://localhost:5173](http://localhost:5173)
   - **API (Healthcheck):** [http://localhost:3000/health](http://localhost:3000/health)
   - **Métricas Prometheus:** [http://localhost:9090/metrics](http://localhost:9090/metrics)

6. **Parando o Ambiente:**
   ```bash
   docker compose down
   ```

---

## 📐 O Processo SDD (Spec-Driven Development)

Este projeto não aceita desenvolvimento de features diretamente no código sem planejamento e especificação prévia. Nós aplicamos os conceitos de SDD para manter a integridade da arquitetura, onde a especificação domina a implementação.

### Workflow para Contribuições

Qualquer mudança, feature ou refatoração segue este ciclo obrigatório:

1. **Discovery & Architecture:** Mapeamento do impacto. Se houver mudança arquitetural, um `ADR` (Architecture Decision Record) deve ser criado em `adr/`.
2. **Specification (SPEC):** Escreve-se o comportamento esperado e as regras de negócio em um arquivo `SPEC` na pasta `specs/`, utilizando o template oficial (`templates/SPEC.md`).
3. **Aprovação Humana:** O arquivo SPEC é validado e aprovado.
4. **Tarefas (TASK):** A SPEC é quebrada em um checklist técnico em `tasks/` (via `templates/TASK.md`).
5. **Implementação & Testes:** Apenas o escopo da TASK aprovada é desenvolvido. Testes (Jest/Vitest) são obrigatórios, mantendo a cobertura acima de 90% (`standards/testing.md`).
6. **Revisão (REVIEW):** O código é validado através do template de Review contra a SPEC inicial.
7. **Documentação:** O arquivo `PROJECT.md` é atualizado para refletir o novo estado canônico após o merge.

*Para uma visão completa das pastas, padrões e log de decisões, explore os diretórios estruturais gerados na raiz do projeto.*
