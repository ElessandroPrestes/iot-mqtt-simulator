# Runbook de lifecycle de secrets

**Status:** controle obrigatório; evidência do gestor externo pendente no deploy real
**Owner:** Maintainer do projeto
**Referências:** `ADR-006`, ASVS `V13.3.1`

## Limite de responsabilidade

A fonte de verdade de produção deve ser um gestor aprovado, como Vault ou
serviço gerenciado equivalente definido pela organização. `SECRETS_DIR` e
Docker Compose são somente o mecanismo final de entrega por arquivo. O
repositório, a imagem, variáveis inline, tickets e diretórios permanentes no host
não são fontes de verdade.

O deploy real não pode avançar enquanto a mudança não registrar:

- produto/namespace do gestor escolhido;
- owner e aprovador;
- identificadores e versões dos secrets, sem seus valores;
- política de acesso do executor;
- datas de criação, rotação e expiração;
- evidência de destruição das cópias temporárias.

Sem essa evidência, `V13.3.1` permanece bloqueado mesmo que o Compose funcione.

## Inventário

| Grupo | Secrets | Consumidor | Prazo |
|---|---|---|---|
| Principals | `auth_principals` com hashes Argon2id e TOTP | API | Rotação por principal/incidente |
| Sessão | `jwt_secret` | API | Máximo 90 dias |
| MongoDB bootstrap | `mongodb_root_username`, `mongodb_root_password` | MongoDB somente | Máximo 90 dias/incidente |
| Grafana | `grafana_admin_password`, `grafana_secret_key` | Grafana | Máximo 90 dias/incidente |
| Edge | `tls_certificate`, `tls_private_key` | Nginx | Antes da expiração/incidente |
| CA interna | `internal_ca` e chave mantida apenas no emissor | Todos validam CA; emissor assina | Conforme PKI aprovada |
| Servidores internos | certificados/chaves de API, Dashboard, broker, Mongo, Prometheus, Loki e gateway | Serviço correspondente | Certificado folha <=24 h |
| Clientes internos | certificados/chaves de Nginx, Prometheus, API, Simulator, healthcheck, Alloy, Grafana e gateway | Workload correspondente | Certificado folha <=24 h |

A chave privada da CA não é um Docker secret dos workloads e não pode existir
no diretório de entrega de produção.

## Criação e aprovação

1. Confirmar necessidade, consumidor, classificação, owner e rotação.
2. Gerar no gestor/emissor com CSPRNG; senhas e JWT devem ter ao menos 256 bits
   de entropia.
3. Para principals, aplicar
   [`password-policy.md`](password-policy.md) antes do hash.
4. Para X.509, restringir SAN, EKU e subject ao workload; chaves não são
   compartilhadas.
5. Exigir aprovação humana separada para root Mongo, admin Grafana,
   `securityAdmin`, chave JWT e CA.
6. Registrar somente ID/version, fingerprint público, validade, owner e ticket.

## Entrega

1. O executor autenticado lê as versões aprovadas para diretório temporário
   exclusivo fora do repositório.
2. Arquivos recebem menor permissão compatível com o UID do container. Nenhum
   arquivo é incorporado por `COPY` ou build arg.
3. `SECRETS_DIR` aponta para esse diretório; a stack falha se ele não estiver
   definido.
4. Cada serviço monta somente os secrets necessários.
5. Após o start, validar identidade, validade, permissões, mTLS e ausência do
   material nos logs/processos.
6. Remover os arquivos temporários quando o runtime/orquestrador não depender
   mais deles; em Docker Compose local, removê-los após o teardown.

O script `prepare-dast-secrets.sh` implementa somente CI efêmero: validade de um
dia, dados sintéticos e destruição no `if: always()`. Ele não é gestor de
produção.

## Rotação

### Certificados internos

- emitir nova folha antes de 24 horas, mantendo o mesmo subject/SAN/EKU;
- entregar e reiniciar/recarregar um workload por vez;
- provar conexão positiva e rejeição sem certificado/hostname inválido;
- revogar/destruir a folha anterior após confirmação;
- para CA, distribuir trust bundle novo+antigo, trocar folhas e só então remover
  a CA antiga.

### JWT

- gerar nova chave aleatória e mudança auditada;
- revogar todas as famílias de sessão e reiniciar a API com a nova versão;
- verificar login, `typ=at+jwt`, issuer/audience e rejeição do token antigo;
- destruir a versão anterior após a janela de rollback aprovada.

Não existe leitura dupla/kid nesta versão; logo, rotação JWT é deliberadamente
invalidante e requer janela de manutenção.

### Principals/TOTP

- desabilitar o principal e revogar suas sessões;
- provisionar nova senha/hash e/ou nova semente por canais separados;
- atualizar atomicamente a versão de `auth_principals`;
- reiniciar a API e provar que material antigo falha;
- remover o estado anti-replay do principal apenas durante reprovisionamento
  controlado.

### MongoDB/Grafana

- criar/ativar a nova credencial ou versão;
- atualizar o workload e executar health/smoke;
- revogar a versão anterior;
- confirmar que API nunca recebeu root Mongo nem admin Grafana.

## Comprometimento

1. bloquear acesso ao gestor e preservar logs centralizados;
2. identificar secret, workloads, período e dados potencialmente afetados;
3. revogar certificado/sessão/credencial imediatamente;
4. rotacionar dependências encadeadas — chave JWT implica todas as sessões; CA
   implica todas as folhas;
5. reconstruir/reiniciar workloads se houver risco de memória/imagem;
6. validar controles negativos e monitorar novos usos;
7. registrar post-mortem sem incluir valores secretos.

## Destruição e evidência

Material expirado/revogado é removido do diretório de entrega, runners, volumes
temporários e backups não autorizados. A fonte externa segue sua política de
versionamento/auditoria, sem permitir restauração por consumidores comuns.

Checklist mínimo de evidência:

- IDs/versões e fingerprints, nunca valores;
- política IAM e log de acesso do gestor;
- emissão/expiração/revogação;
- resultado dos testes de bootstrap/TLS/auth;
- confirmação de cleanup;
- aprovação e SHA do deploy.

## Gate

Este runbook documenta o processo, mas não declara que um gestor específico
está operante. O Review Agent só pode converter `V13.3.1` para `Pass` após
evidência real da fonte externa e de pelo menos um ciclo criação→entrega→rotação
ou revogação→destruição.
