# Gate do certificado público de produção

**Status:** `N/A` no escopo exclusivamente local aprovado em 2026-07-27
**Owner:** Arquitetura local
**Referência:** ASVS `V12.2.2`

## Decisão de escopo vigente

O projeto não terá deploy público ou remoto nesta entrega. A aplicação é
acessada somente por loopback em `https://localhost:8443`, sem DNS público,
ingress externo ou usuário remoto. Como `V12.2.2` se aplica a serviços
external-facing, o requisito está justificado como `N/A`.

O restante deste documento fica preservado como gate dormente. Qualquer decisão
futura de expor o serviço reabre este controle e exige novo ciclo SDD antes do
deploy.

## Objetivo

O certificado efêmero autoassinado gerado para CI/local valida configuração e
TLS, mas não prova confiança pública. Antes do review final de release, o
endpoint real deve apresentar certificado emitido por CA publicamente
confiável, válido para o hostname oficial e sem erro de cadeia.

## Pré-condições

- hostname e porta de produção definidos;
- DNS apontando para o edge autorizado;
- certificado/chave entregues pelo gestor de secrets;
- somente Nginx publicado;
- janela de mudança, owner e rollback registrados.

## Verificação

Executar de rede externa confiável, substituindo `<host>`:

```bash
openssl s_client \
  -connect <host>:443 \
  -servername <host> \
  -verify_hostname <host> \
  -verify_return_error </dev/null
```

Registrar saída sanitizada que demonstre:

- `Verify return code: 0`;
- SAN contém exatamente o hostname utilizado;
- cadeia completa até trust anchor público;
- certificado folha dentro da validade;
- assinatura e chave conformes à política criptográfica;
- certificado não é autoassinado.

Executar também:

```bash
openssl s_client -connect <host>:443 -servername <host> -tls1_2 </dev/null
openssl s_client -connect <host>:443 -servername <host> -tls1_1 </dev/null
```

TLS 1.2 deve negociar; TLS 1.1 deve falhar. Validar TLS 1.3 quando suportado
pelo cliente. Confirmar com `curl` sem `--insecure`:

```bash
curl --fail --silent --show-error https://<host>/health
```

Por fim, executar DAST contra o mesmo hostname e confirmar headers, redirect
HTTP→HTTPS, ausência de portas internas e zero alerta bloqueador.

## Evidência permitida

Anexar ao run/artefato:

- hostname, timestamp UTC e SHA implantado;
- subject, issuer, SAN, serial, fingerprint SHA-256 e datas;
- resultado de verificação da cadeia/hostname;
- protocolos e cipher suites negociados/rejeitados;
- relatório DAST e aprovação da mudança.

Não anexar chave privada, secret ID com valor, cookie, token ou credencial.

## Renovação e falha

Monitorar expiração e renovar antes da janela definida pelo emissor. Falha de
hostname, cadeia, expiração, revogação ou algoritmo bloqueia deploy/release e
exige rollback para certificado válido. Comprometimento da chave exige
revogação, nova chave e investigação conforme
[`secrets-lifecycle.md`](secrets-lifecycle.md).

## Critério de fechamento

No escopo vigente, `V12.2.2` permanece `N/A` enquanto não existir serviço
external-facing. Se um endpoint público entrar no escopo, este gate volta a ser
aplicável e permanece `Fail` até sua execução completa.
