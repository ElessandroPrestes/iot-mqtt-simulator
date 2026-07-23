# TASK-011: OpenAPI / Swagger Documentation

## Fase
**5 — Documentação e Release**

## SPEC Associada
[SPEC-005-api-documentation.md](../specs/SPEC-005-api-documentation.md)

## Prioridade
**P3 — Normal**

## Problema (D2)
Não há documentação interativa dos endpoints da API. Novos desenvolvedores e stakeholders precisam consultar o `PROJECT.md` para entender os contratos.

## Escopo
- `services/api/package.json` — adicionar dependências
- `services/api/src/app.js` — montar Swagger UI
- `services/api/src/routes/*.js` — adicionar anotações JSDoc

## Dependências a Adicionar
```bash
npm install swagger-jsdoc swagger-ui-express
```

## O que Fazer

### 1. Configuração em `app.js`
```js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IoT MQTT Simulator API',
      version: '1.0.0',
      description: 'API para monitoramento de sensores industriais IoT em tempo real',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### 2. Anotações JSDoc nos routes

#### Exemplo para `GET /api/v1/readings`
```js
/**
 * @swagger
 * /readings:
 *   get:
 *     summary: Retorna leituras paginadas de sensores
 *     tags: [Readings]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: sensorId
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [temperature, pressure, humidity, vibration] }
 *     responses:
 *       200:
 *         description: Lista de leituras
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadingListResponse'
 */
```

### 3. Schemas a documentar
- `Reading` — objeto de leitura de sensor
- `Alert` — objeto de alerta
- `SuccessResponse` — envelope `{ success, data, meta }`
- `ErrorResponse` — envelope `{ success, error }`

## Critério de Aceite
- [ ] `GET http://localhost:3000/api/docs` exibe Swagger UI
- [ ] Todos os endpoints documentados (readings, alerts, sensors, health)
- [ ] Schemas de request/response documentados
- [ ] Autenticação via Bearer token configurada no Swagger UI

## Status
🔴 **Aberto**
