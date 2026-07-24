const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../../..');

function read(name) {
  return fs.readFileSync(path.join(root, 'docs/security', name), 'utf8');
}

describe('ASVS Level 2 security documentation', () => {
  it('defines the contextual password denylist and provisioning boundary', () => {
    const policy = read('password-policy.md');

    expect(policy).toMatch(/Palavras contextuais proibidas/);
    expect(policy).toMatch(/iot-mqtt-simulator/);
    expect(policy).toMatch(/antes da geração do hash/);
    expect(policy).toMatch(/m=19456.*t=2.*p=1/);
  });

  it('documents route, field, websocket and workload authorization', () => {
    const matrix = read('authorization-matrix.md');

    for (const operation of [
      'GET /api/v1/auth/sessions',
      'DELETE /api/v1/auth/admin/sessions/:principalId/:familyId',
      'PATCH /api/v1/alerts/:id/resolve',
      'GET /metrics',
      'subscribe:sensor',
      'factory/sensors/+/+',
    ]) {
      expect(matrix).toContain(operation);
    }
    expect(matrix).toMatch(/Body obrigatoriamente vazio/);
    expect(matrix).toMatch(/deny by default/);
  });

  it('inventories approved crypto and defines an agility process', () => {
    const policy = read('cryptography-policy.md');

    for (const control of [
      'Argon2id',
      'TOTP',
      'HS256',
      'MONGODB-X509',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'Crypto agility',
    ]) {
      expect(policy).toContain(control);
    }
    expect(policy).toMatch(/validade máxima de 24 h/i);
  });

  it('classifies sensitive assets and ties each level to controls', () => {
    const classification = read('data-classification.md');

    for (const level of ['Público', 'Interno', 'Confidencial', 'Restrito']) {
      expect(classification).toContain(level);
    }
    expect(classification).toMatch(/TTL automático de 7 dias/);
    expect(classification).toMatch(/no-store/);
  });

  it('sets risk-based remediation deadlines and tracks current advisories', () => {
    const policy = read('vulnerability-management.md');

    expect(policy).toContain('| Crítica | 24 horas |');
    expect(policy).toContain('| Alta | 7 dias |');
    expect(policy).toContain('| Moderada | 30 dias |');
    expect(policy).toContain('GHSA-fgmj-fm8m-jvvx');
    expect(policy).toContain('2026-08-23');
  });

  it('authorizes exactly the six centralized log producers and 30-day retention', () => {
    const inventory = read('logging-inventory.md');

    for (const serviceName of ['api', 'simulator', 'edge', 'dashboard', 'broker', 'mongo']) {
      expect(inventory).toContain(`\`${serviceName}\``);
    }
    expect(inventory).toContain('30 dias (`720h`)');
    expect(inventory).toMatch(/deletion_mode: disabled/);
    expect(inventory).toMatch(/somente para\s+leitura/);
  });

  it('keeps external secret management and public certificate as honest deploy gates', () => {
    const secrets = read('secrets-lifecycle.md');
    const certificate = read('production-certificate-gate.md');

    expect(secrets).toMatch(/não pode avançar/);
    expect(secrets).toContain('`V13.3.1` permanece bloqueado');
    expect(certificate).toContain('`V12.2.2` permanece `Fail`');
    expect(certificate).toMatch(/Verify return code: 0/);
  });
});
