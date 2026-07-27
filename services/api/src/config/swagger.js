const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IoT MQTT Simulator API',
      version: '1.0.0',
      description: 'API RESTful para gerenciar sensores e telemetria no IoT MQTT Simulator.',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'V1 API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Reading: {
          type: 'object',
          required: ['sensorId', 'type', 'value', 'unit', 'status', 'timestamp'],
          properties: {
            sensorId: { type: 'string', example: 'TEMP-01' },
            type: {
              type: 'string',
              enum: ['temperature', 'pressure', 'humidity', 'vibration'],
            },
            value: { type: 'number', example: 42.5 },
            unit: { type: 'string', example: '°C' },
            status: {
              type: 'string',
              enum: ['normal', 'warning', 'critical'],
            },
            timestamp: { type: 'string', format: 'date-time' },
            metadata: { type: 'object', additionalProperties: true },
          },
        },
        Alert: {
          type: 'object',
          required: ['sensorId', 'type', 'value', 'level', 'message', 'timestamp'],
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            sensorId: { type: 'string', example: 'TEMP-01' },
            type: {
              type: 'string',
              enum: ['temperature', 'pressure', 'humidity', 'vibration'],
            },
            value: { type: 'number', example: 92.1 },
            level: { type: 'string', enum: ['warning', 'critical'] },
            message: { type: 'string' },
            resolved: { type: 'boolean' },
            timestamp: { type: 'string', format: 'date-time' },
            resolvedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {},
            meta: { type: 'object', additionalProperties: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string' },
                details: { type: 'array', items: {} },
                correlationId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, '../routes/*.js')],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app, { enabled = true } = {}) => {
  if (!enabled) return;
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
