# 🏭 IoT MQTT Simulator

![Status: Ativo](https://img.shields.io/badge/Status-Active-brightgreen)
![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-blue)
![SDD: Ready](https://img.shields.io/badge/Spec--Driven--Development-Ready-blueviolet)

Plataforma fullstack de simulação e monitoramento IoT industrial em tempo real, baseada em microserviços e comunicação orientada a eventos (MQTT/WebSockets).

Este projeto é gerido rigorosamente através do **Universal SDD Framework (Spec-Driven Development)**, garantindo que o código, a arquitetura e a documentação evoluam em sincronia e sob supervisão contínua, tanto humana quanto de Inteligência Artificial.

## 🏭 Caso de Uso Empresarial

O **IoT MQTT Simulator** é uma arquitetura de referência para telemetria industrial (Indústria 4.0).
Ele demonstra como ingerir milhares de eventos por segundo gerados por sensores (Vibração, Temperatura, Pressão e Umidade),
processar estes dados através de um broker de mensagens ultrarrápido (Mosquitto), e distribuí-los para:
1. **Armazenamento de Séries Temporais:** MongoDB com coleções `timeseries` para análise histórica.
2. **Monitoramento em Tempo Real:** Dashboard Vue.js reativo via WebSockets.
3. **Alertas e Notificações:** Mecanismo de threshold que gera alertas críticos quando os sensores ultrapassam limites de segurança.
4. **Observabilidade:** Coleta de métricas operacionais pelo Prometheus, exibidas no Grafana.

---

## 🏗️ Arquitetura

```mermaid
graph TD
    %% Componentes
    S[IoT Simulator<br/>(Node.js)] -->|MQTT| B(MQTT Broker<br/>Mosquitto)
    B <-->|MQTT| A[API Backend<br/>(Node.js/Express)]
    A -->|Mongoose| M[(MongoDB<br/>Timeseries)]
    A -->|Socket.io| D[Dashboard Vue.js<br/>(Tempo Real)]
    D -->|HTTP REST| A
    N[Nginx Reverse Proxy] -->|Port 80/443| D
    N -->|Proxy Pass| A
    P[Prometheus] -->|Scrape :3000/metrics| A
    G[Grafana] -->|Query| P
    
    classDef node fill:#1e1e1e,stroke:#4caf50,stroke-width:2px,color:#fff;
    classDef db fill:#003b00,stroke:#8bc34a,stroke-width:2px,color:#fff;
    classDef proxy fill:#002b36,stroke:#268bd2,stroke-width:2px,color:#fff;
    
    class S,A,D node;
    class M db;
    class N,P,G proxy;
```

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

3. **Subindo a Infraestrutura (Dev vs Prod):**
   Execute o build e levante todos os serviços em background com o comando atalho do Makefile. 
   O Docker vai construir as imagens do Node.js (API, Dashboard e Simulator) e iniciar o Mosquitto, MongoDB, Nginx, Prometheus e Grafana.
   
   Para ambiente de Produção (Stack completa com Monitoramento e Proxy Nginx):
   ```bash
   make prod-up
   ```

   Para ambiente de Desenvolvimento (Sem Grafana/Nginx):
   ```bash
   make build
   make up
   ```

4. **Verificando a Execução:**
   ```bash
   docker compose ps
   ```
   *Certifique-se de que os containers `iot_broker`, `iot_mongo`, `iot_api`, `iot_simulator` e `iot_dashboard` estejam com status "Up".*

5. **Acessando a Aplicação (Produção `make prod-up`):**
   - **Dashboard (Nginx):** [http://localhost:8080](http://localhost:8080)
   - **API (Nginx Proxied):** [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
   - **Grafana:** [http://localhost:3001](http://localhost:3001) *(User: `admin`, Pass: `admin`)*
   - **Prometheus UI:** [http://localhost:9091](http://localhost:9091)
   
   *(Em Dev `make up`: Dashboard em `localhost:5173` e API em `localhost:3000`)*

6. **Rodando os Testes e Cobertura:**
   A API possui testes automatizados (unitários e integração). Para executá-los:
   ```bash
   cd services/api
   npm test               # Roda a suíte de testes
   npm run test:coverage  # Gera o relatório de cobertura em /coverage
   ```
   *(A cobertura atual deve se manter em no mínimo 90% conforme diretrizes do SDD)*

7. **Parando o Ambiente:**
   ```bash
   make down
   ```

   *(Utilitários extras: Use `make logs` para acompanhar os logs em tempo real, ou `make help` para ver todos os atalhos disponíveis.)*

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
