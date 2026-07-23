module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  // Aumentado para acomodar o MongoMemoryServer (download de binário
  // ou ambiente lento). 5s (padrão) é insuficiente em alguns ambientes.
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.js',
    // Excluídos: arquivos de bootstrap e infraestrutura que requerem
    // conexões externas reais (MQTT broker, Socket.io server) e não
    // possuem lógica de negócio testável unitariamente.
    '!src/index.js',
    '!src/config/**',
    '!src/routes/index.js',
    '!src/services/mqttService.js',
    '!src/websocket/socketServer.js',
  ],
  coverageThreshold: {
    global: { lines: 90, functions: 90, branches: 85, statements: 90 },
  },
  testMatch: ['**/tests/**/*.test.js'],
};
