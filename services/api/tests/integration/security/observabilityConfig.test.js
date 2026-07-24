const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function serviceBlock(compose, service) {
  const match = compose.match(new RegExp(
    `^  ${service}:\\n[\\s\\S]*?(?=^  [a-z0-9-]+:\\n|^secrets:)`,
    'm'
  ));
  if (!match) throw new Error(`Service ${service} is missing from production Compose`);
  return match[0];
}

describe('protected centralized logging topology', () => {
  const compose = read('docker-compose.prod.yml');
  const apiService = serviceBlock(compose, 'api');
  const alloyService = serviceBlock(compose, 'alloy');
  const lokiService = serviceBlock(compose, 'loki');
  const alloy = read('infrastructure/alloy/config.alloy');
  const gateway = read('infrastructure/loki/gateway.conf');
  const loki = read('infrastructure/loki/loki.yml');
  const grafanaDatasource = read(
    'infrastructure/grafana/provisioning/datasources/datasource.yml'
  );

  it('ships application logs through Alloy to an authenticated mTLS gateway', () => {
    expect(apiService).toMatch(/api_logs:\/var\/log\/iot-api/);
    expect(alloyService).toMatch(/user: "473:473"/);
    expect(alloyService).toMatch(/api_logs:\/var\/log\/iot-api:ro/);
    expect(alloy).toMatch(/loki\.source\.file "application"/);
    expect(alloy).toMatch(/url\s*=\s*"https:\/\/loki-gateway:8443\/loki\/api\/v1\/push"/);
    expect(alloy).toMatch(/ca_file\s*=\s*"\/run\/secrets\/internal_ca"/);
    expect(alloy).toMatch(/cert_file\s*=\s*"\/run\/secrets\/alloy_client_cert"/);
    expect(alloy).toMatch(/key_file\s*=\s*"\/run\/secrets\/alloy_client_key"/);
    expect(alloy).toMatch(/insecure_skip_verify\s*=\s*false/);
  });

  it('requires mTLS at the gateway and between the gateway and Loki', () => {
    expect(gateway).toMatch(/listen 8443 ssl/);
    expect(gateway).toMatch(/ssl_verify_client on/);
    expect(gateway).toMatch(/proxy_pass https:\/\/loki:3100/);
    expect(gateway).toMatch(/proxy_ssl_verify on/);
    expect(gateway).toMatch(/proxy_ssl_certificate \/run\/secrets\/loki_gateway_client_cert/);
    expect(gateway).toMatch(/proxy_ssl_certificate_key \/run\/secrets\/loki_gateway_client_key/);
    expect(loki).toMatch(/client_auth_type: RequireAndVerifyClientCert/);
    expect(loki).toMatch(/client_ca_file: \/run\/secrets\/internal_ca/);
  });

  it('isolates immutable central storage and enforces retention without deletion API', () => {
    expect(lokiService).toMatch(/loki_data:\/loki/);
    expect(lokiService).toMatch(/networks:\n\s+- observability/);
    expect(apiService).not.toMatch(/loki_data|observability/);
    expect(alloyService).not.toMatch(/loki_data/);
    expect(loki).toMatch(/retention_period: 720h/);
    expect(loki).toMatch(/retention_enabled: true/);
    expect(loki).toMatch(/deletion_mode: disabled/);
    expect(gateway).toMatch(/limit_except GET POST/);
  });

  it('keeps Grafana authenticated and queries Loki through the mTLS gateway', () => {
    expect(compose).toMatch(/GF_AUTH_ANONYMOUS_ENABLED: "false"/);
    expect(grafanaDatasource).toMatch(/type: loki/);
    expect(grafanaDatasource).toMatch(/url: https:\/\/loki-gateway:8443/);
    expect(grafanaDatasource).toMatch(/tlsAuth: true/);
    expect(grafanaDatasource).toMatch(/tlsAuthWithCACert: true/);
    expect(grafanaDatasource).toMatch(/tlsSkipVerify: false/);
  });
});
