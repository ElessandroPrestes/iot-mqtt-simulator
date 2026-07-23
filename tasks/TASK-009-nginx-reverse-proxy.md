# TASK-009: nginx Reverse Proxy para Produção

## Fase
**3 — Segurança e Produção**

## Prioridade
**P2 — Média**

## Problema (Feature F7 / Infra I3)
O diretório `infrastructure/nginx/` está vazio. O `docker-compose.prod.yml` referencia o serviço `nginx` mas não há configuração. Sem nginx, não é possível fazer deploy de produção real.

## Escopo
- `infrastructure/nginx/nginx.conf` (NOVO)
- `infrastructure/nginx/conf.d/default.conf` (NOVO)
- `docker-compose.prod.yml` — validar configuração do serviço nginx

## O que Fazer

### 1. Estrutura de Arquivos
```
infrastructure/nginx/
├── nginx.conf          # Configuração principal nginx
└── conf.d/
    └── default.conf    # Virtual host principal
```

### 2. `nginx.conf` (principal)
- Worker processes: auto
- Events: worker_connections 1024
- Gzip habilitado
- Incluir `conf.d/*.conf`

### 3. `conf.d/default.conf`
```nginx
upstream api {
    server api:3000;
}

server {
    listen 80;
    server_name _;

    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Proxy para API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://api/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check (sem auth)
    location /health {
        proxy_pass http://api/health;
    }

    # Static dashboard (build)
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. Validar `docker-compose.prod.yml`
- Serviço nginx com volumes corretos
- Build do dashboard copiado para volume compartilhado com nginx
- Rede interna entre nginx e api

## Critério de Aceite
- [ ] `docker compose -f docker-compose.prod.yml up -d` sobe tudo sem erros
- [ ] Dashboard acessível em `http://localhost:80`
- [ ] API acessível em `http://localhost:80/api/`
- [ ] WebSocket funciona via nginx
- [ ] Headers de segurança presentes nas respostas

## Status
🔴 **Aberto**
