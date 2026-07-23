.PHONY: help up down logs build prod-up prod-down prod-build test clean

# Default target
help:
	@echo "Comandos disponíveis:"
	@echo "  make up          - Inicia os containers em modo desenvolvimento (docker-compose.yml)"
	@echo "  make down        - Para e remove os containers em modo desenvolvimento"
	@echo "  make logs        - Exibe os logs dos containers em desenvolvimento"
	@echo "  make build       - Constrói as imagens dos containers em desenvolvimento"
	@echo "  make prod-up     - Inicia os containers em modo produção (docker-compose.prod.yml)"
	@echo "  make prod-down   - Para e remove os containers em modo produção"
	@echo "  make prod-build  - Constrói as imagens dos containers em produção"
	@echo "  make test        - Executa os testes localmente (API e Dashboard)"
	@echo "  make clean       - Remove containers, redes e volumes (aviso: dados serão perdidos)"

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-build:
	docker compose -f docker-compose.prod.yml build

test:
	@echo "Executando testes da API..."
	cd services/api && npm test
	@echo "Executando testes do Dashboard..."
	cd services/dashboard && npm test

clean:
	docker compose down -v
	docker compose -f docker-compose.prod.yml down -v
