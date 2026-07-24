const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('production internal TLS topology', () => {
  const compose = read('docker-compose.prod.yml');
  const edge = read('infrastructure/nginx/templates/default.conf.template');
  const dashboard = read('services/dashboard/nginx.conf');
  const broker = read('services/broker/mosquitto.prod.conf');
  const prometheus = read('infrastructure/prometheus/prometheus.yml');
  const prometheusWeb = read('infrastructure/prometheus/web.yml');
  const grafanaDatasource = read(
    'infrastructure/grafana/provisioning/datasources/datasource.yml'
  );
  const mongoBootstrap = read('infrastructure/mongodb/10-create-x509-user.js');

  it('requires certificate identities on MQTT and removes password auth', () => {
    expect(broker).toMatch(/listener 8883/);
    expect(broker).toMatch(/cafile \/run\/secrets\/internal_ca/);
    expect(broker).toMatch(/certfile \/run\/secrets\/broker_tls_cert/);
    expect(broker).toMatch(/keyfile \/run\/secrets\/broker_tls_key/);
    expect(broker).toMatch(/require_certificate true/);
    expect(broker).toMatch(/use_identity_as_username true/);
    expect(broker).not.toMatch(/password_file/);
    expect(compose).not.toMatch(/MQTT_(?:USERNAME|PASSWORD)(?:_FILE)?:/);
    expect(compose).not.toMatch(/mosquitto_password_file/);
  });

  it('requires verified mTLS from the edge to API and Dashboard', () => {
    expect(edge).toMatch(/server api:3000/);
    expect(edge).toMatch(/server dashboard:8443/);
    expect(edge).toMatch(/proxy_pass https:\/\/api/);
    expect(edge).toMatch(/proxy_pass https:\/\/dashboard/);
    expect(edge).toMatch(/proxy_ssl_verify on/);
    expect(edge).toMatch(/proxy_ssl_trusted_certificate \/run\/secrets\/internal_ca/);
    expect(edge).toMatch(/proxy_ssl_certificate \/run\/secrets\/nginx_client_cert/);
    expect(edge).toMatch(/proxy_ssl_certificate_key \/run\/secrets\/nginx_client_key/);

    expect(dashboard).toMatch(/listen 8443 ssl/);
    expect(dashboard).toMatch(/ssl_client_certificate \/run\/secrets\/internal_ca/);
    expect(dashboard).toMatch(/ssl_verify_client on/);
  });

  it('requires TLS for MongoDB and authenticated Prometheus scraping', () => {
    expect(compose).toMatch(/--tlsMode/);
    expect(compose).toMatch(/requireTLS/);
    expect(compose).toMatch(/--tlsCAFile/);
    expect(compose).toMatch(/--tlsCertificateKeyFile/);
    expect(compose).not.toMatch(/MONGODB_URI_FILE: \/run\/secrets\/mongodb_uri/);
    expect(mongoBootstrap).toMatch(/createUser: 'CN=api-processor'/);
    expect(mongoBootstrap).toMatch(/role: 'readWrite', db: 'iot_dashboard'/);
    expect(mongoBootstrap).not.toMatch(/dbAdmin|root|userAdmin/);

    expect(prometheus).toMatch(/scheme: "https"/);
    expect(prometheus).toMatch(/server_name: "api"/);
    expect(prometheus).toMatch(/ca_file: \/run\/secrets\/internal_ca/);
    expect(prometheus).toMatch(/cert_file: \/run\/secrets\/prometheus_client_cert/);
    expect(prometheus).toMatch(/key_file: \/run\/secrets\/prometheus_client_key/);
    expect(prometheus).toMatch(/insecure_skip_verify: false/);

    expect(prometheusWeb).toMatch(/client_auth_type: RequireAndVerifyClientCert/);
    expect(prometheusWeb).toMatch(/client_allowed_sans:\n\s+- grafana/);
    expect(prometheusWeb).toMatch(/min_version: TLS12/);
    expect(grafanaDatasource).toMatch(/url: https:\/\/prometheus:9090/);
    expect(grafanaDatasource).not.toMatch(/url: http:\/\/prometheus:9090/);
  });

  it('pins approved cipher suites on every TLS server', () => {
    expect(edge).toMatch(/ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384/);
    expect(dashboard).toMatch(/ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384/);
    expect(broker).toMatch(/ciphers ECDHE-RSA-AES256-GCM-SHA384/);
  });
});
