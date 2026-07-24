db.getSiblingDB('$external').runCommand({
  createUser: 'CN=api-processor',
  roles: [{ role: 'readWrite', db: 'iot_dashboard' }],
});
