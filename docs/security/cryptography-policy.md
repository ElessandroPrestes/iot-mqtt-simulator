# Política e inventário criptográfico

**Status:** vigente para o perfil de produção da `TASK-014`
**Owner:** Maintainer do projeto
**Revisão mínima:** semestral e em toda mudança criptográfica
**Referências:** `SPEC-006`, `ADR-006`, ASVS `V11.1.1`, `V11.1.2`, `V11.2.2`

## Princípios

- usar somente primitivas de Node.js/OpenSSL ou bibliotecas mantidas;
- usar CSPRNG para toda chave, token, salt ou segredo;
- manter material secreto fora do Git, das imagens, dos logs e da linha de
  comando;
- fixar algoritmo/protocolo por allowlist e falhar fechado;
- separar identidade e chave por workload;
- registrar algoritmo, finalidade, owner, versão, fingerprint e validade, mas
  nunca o valor secreto;
- tratar certificado autoassinado do edge como válido apenas para CI/local.

## Inventário

| Finalidade | Algoritmo/parâmetro aprovado | Material e armazenamento | Rotação/validade | Evidência |
|---|---|---|---|---|
| Senha de principal | Argon2id v19; `m>=19456`, `t>=2`, `p>=1`, salt >=128 bits, saída >=256 bits | Somente hash no secret `auth_principals`; senha não persistida | Em comprometimento/mudança de função | `config/security.js`, testes de parâmetros |
| Segundo fator | TOTP, 6 dígitos, 30 s, janela ±1, HMAC-SHA1 conforme o protocolo | Semente Base32 no gestor externo/secret de principals | Em perda, exposição ou reprovisionamento | `utils/totp.js`, teste anti-replay |
| Access token | JWT `HS256`; header `typ=at+jwt`; `iss`, `aud`, `sub`, `sid`, `jti`, `iat`, `exp` | Chave aleatória >=256 bits em `JWT_SECRET_FILE`; token apenas em memória no browser | Chave no máximo 90 dias ou incidente; token <=15 min | `authService.js`, `authenticate.js` |
| Refresh token | 32 bytes aleatórios, Base64url | Browser: cookie `__Host-refresh`; servidor: somente SHA-256 do token | Uso único; sessão absoluta <=8 h e inatividade <=30 min | `authService.js`, `Session.js` |
| TLS edge | TLS 1.2/1.3; certificado de CA publicamente confiável | Certificado/chave entregues por secret | Renovar antes da expiração; gate de deploy obrigatório | Nginx e [`production-certificate-gate.md`](production-certificate-gate.md) |
| CA interna | X.509 RSA 3072, assinatura SHA-256 | Fonte externa; somente certificado CA distribuído aos clientes | Política do emissor; rotação com bundle sobreposto | `prepare-dast-secrets.sh` como implementação efêmera |
| Certificados internos | X.509 RSA 3072/SHA-256, EKU e SAN específicos | Chave separada por workload, entregue por secret | Validade máxima de 24 h; revogação imediata | Compose, script CI e testes TLS |
| MongoDB | TLS + mTLS; autenticação `MONGODB-X509` | Certificado `api-processor`; root separado | Certificado <=24 h | Compose e criação do usuário X.509 |
| MQTT | TLS + mTLS; identidade do subject X.509 | Certificados de API, Simulator e healthcheck | Certificado <=24 h | Mosquitto, ACL e testes de integração |
| Logs/observabilidade | TLS/mTLS entre Alloy, gateway, Loki, Grafana e Prometheus | Certificados individuais por workload | Certificado <=24 h | configs Alloy/Loki/Prometheus/Grafana |

HMAC-SHA1 é permitido exclusivamente dentro do TOTP interoperável. SHA-1 para
assinatura de certificados, hashes de senha, integridade genérica ou assinatura
de tokens é proibido.

## Cipher suites e protocolos

Somente TLS 1.2 e TLS 1.3 são permitidos. TLS 1.2 usa:

- `ECDHE-RSA-AES256-GCM-SHA384`;
- `ECDHE-RSA-AES128-GCM-SHA256`.

TLS 1.3 usa:

- `TLS_AES_256_GCM_SHA384`;
- `TLS_CHACHA20_POLY1305_SHA256`;
- `TLS_AES_128_GCM_SHA256`.

TLS 1.0/1.1, SSL, cifras estáticas RSA, CBC, RC4, 3DES, export e `NULL` são
proibidos. Tickets de sessão TLS ficam desabilitados nos Nginx gerenciados pelo
projeto. Todo cliente interno valida CA, SAN/hostname e cadeia; não é permitido
`insecure_skip_verify=true`.

## Lifecycle

Criação, entrega, rotação, revogação e destruição seguem
[`secrets-lifecycle.md`](secrets-lifecycle.md). Em resumo:

1. gerar no gestor/emissor aprovado usando CSPRNG;
2. atribuir ID/versionamento e owner sem registrar o valor;
3. entregar como arquivo somente ao workload autorizado;
4. validar permissões, finalidade, parâmetros e validade antes do start;
5. rotacionar dentro do prazo ou imediatamente em comprometimento;
6. reiniciar/recarregar workloads e executar smoke TLS/autenticação;
7. revogar versão anterior, encerrar sessões quando aplicável e destruir cópias
   temporárias.

A rotação da chave HS256 invalida todos os access tokens e deve ser acompanhada
da revogação das famílias de sessão. A CA interna deve usar sobreposição
controlada de trust bundle; não substituir emissor e certificados folha sem
janela de coexistência testada.

## Crypto agility

Algoritmos não são escolhidos pelo cliente. Mudança de algoritmo exige:

1. issue/ADR com motivação, análise de interoperabilidade e plano de rollback;
2. atualização deste inventário e da allowlist central;
3. teste negativo do algoritmo antigo/proibido e teste positivo do novo;
4. rotação/versionamento do material, com suporte de leitura dupla apenas
   durante janela explicitamente limitada;
5. validação de stack, DAST, dependency/image scans e revisão humana;
6. remoção do algoritmo/material anterior após a janela.

Gatilhos obrigatórios: depreciação por Node/OpenSSL, vulnerabilidade relevante,
mudança regulatória, expiração do algoritmo/parâmetro ou comprometimento de
chave. Não é permitido habilitar algoritmo dinamicamente por input de usuário
ou variável não validada.

## Evidência reproduzível

- TLS/ciphers: `docker-compose.prod.yml`, configs Nginx, Mosquitto, Loki e
  Prometheus, mais `internalTlsConfig.test.js`;
- JWT/sessão/Argon2id/TOTP: `security.test.js`, `authenticate.test.js`,
  `auth.test.js` e `totp.test.js`;
- emissão efêmera: `scripts/ci/prepare-dast-secrets.sh`;
- certificado público: somente a evidência do gate de deploy real pode fechar
  `V12.2.2`; o certificado local/CI não é substituto.
