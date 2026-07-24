# Política de senhas e autenticação de principals

**Status:** vigente para o perfil de produção da `TASK-014`
**Owner:** Maintainer do projeto
**Revisão mínima:** anual ou após incidente/mudança de autenticação
**Referências:** `SPEC-006`, `ADR-006`, ASVS `V6.1.2`

## Escopo

Esta política se aplica aos principals administrativos provisionados em
`AUTH_PRINCIPALS_FILE`. O produto não oferece cadastro, troca ou recuperação de
senha self-service. Portanto, a validação da senha em texto puro ocorre no
processo administrativo, antes da geração do hash; a API recebe somente o hash
Argon2id e o segredo TOTP pelo mecanismo de secrets.

## Requisitos

- usar senha ou passphrase exclusiva, gerada aleatoriamente, com 15 a 128
  caracteres;
- não impor composição artificial de maiúsculas, números ou símbolos;
- rejeitar senhas presentes em lista de credenciais comuns/comprometidas
  mantida pelo gestor de secrets;
- rejeitar senha que contenha, sem diferenciar maiúsculas/minúsculas, o
  username, o ID do principal, o papel ou qualquer palavra contextual abaixo;
- gerar hash Argon2id v19 com, no mínimo, `m=19456`, `t=2` e `p=1`, salt
  aleatório exclusivo de ao menos 128 bits e saída de ao menos 256 bits;
- exigir TOTP de seis dígitos para todo principal habilitado em produção;
- nunca registrar, transmitir por chat/ticket, versionar ou manter a senha em
  texto puro após o provisionamento;
- não realizar troca periódica sem evidência de comprometimento. Rotacionar
  imediatamente em incidente, exposição, desligamento ou mudança de função.

O limite mínimo de oito caracteres no schema HTTP é somente validação defensiva
do protocolo. Ele não substitui o mínimo de 15 caracteres aplicado pelo
provisionador.

## Palavras contextuais proibidas

A lista mínima é:

`iot`, `mqtt`, `iotmqtt`, `simulator`, `simulador`, `sensor`, `sensors`,
`factory`, `fabrica`, `industrial`, `dashboard`, `monitor`, `monitoring`,
`viewer`, `operator`, `admin`, `securityadmin`, `produção`, `producao`,
`production`, `desenvolvimento`, `development`, `localhost` e
`iot-mqtt-simulator`.

O provisionador também deve adicionar:

- nome e sigla da organização, unidade, planta e departamento;
- domínio DNS, hostname, nome do ambiente e identificador do projeto;
- username, ID e papel do principal;
- codinomes ou nomes públicos do produto;
- variações triviais: caixa, separadores, plural, substituições como `0/o`,
  `1/i/l`, `3/e`, `4/a`, `5/s` e `@/a`.

Alterar o nome do produto, domínio ou organização exige revisar esta lista antes
do próximo provisionamento.

## Provisionamento

1. O Maintainer abre mudança auditável e confirma papel, necessidade do acesso
   e, separadamente, a necessidade de `securityAdmin`.
2. O gestor aprovado gera a senha e o segredo TOTP com CSPRNG.
3. O provisionador valida comprimento, lista comprometida e palavras
   contextuais antes de calcular o Argon2id.
4. O artefato contém somente `id`, `username`, `passwordHash`, `role`,
   `enabled`, `securityAdmin` e `totpSecret`.
5. O artefato é gravado na fonte externa de verdade e entregue ao Compose como
   arquivo. O repositório não recebe valores reais.
6. A aplicação deve recusar o bootstrap se o hash estiver abaixo dos parâmetros
   mínimos ou se faltar TOTP em produção.
7. A senha e a semente TOTP são entregues por canais separados; a cópia
   transitória é destruída após confirmação.

## Bloqueio, recuperação e evidência

Não existe bypass de MFA. Perda do fator exige desabilitar o principal,
revogar suas sessões e provisionar nova semente TOTP por mudança administrativa
auditada. Suspeita de senha comprometida exige também nova senha/hash.

A evidência permitida registra somente ticket, principal, aprovador, versão do
secret, parâmetros Argon2id, data e resultado das validações. Senha, hash,
semente TOTP e códigos TOTP não podem constar na evidência.

## Evidência no repositório

- validação de hash/MFA: `services/api/src/config/security.js`;
- autenticação e anti-replay TOTP:
  `services/api/src/services/authService.js` e
  `services/api/src/utils/totp.js`;
- testes: `services/api/tests/unit/config/security.test.js`,
  `services/api/tests/unit/utils/totp.test.js` e
  `services/api/tests/integration/routes/auth.test.js`;
- lifecycle: [`secrets-lifecycle.md`](secrets-lifecycle.md).
