const Joi = require('joi');
const { auditSecurityEvent } = require('./securityAudit');

function validate(schema, target = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      allowUnknown: false,
      convert: true,
      stripUnknown: false,
    });
    if (error) {
      auditSecurityEvent(req, 'input.validation', 'denied', {
        target,
      });
      return res.status(400).json({
        success: false,
        error: {
          code:    'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error.details.map(d => d.message),
        },
      });
    }
    req[target] = value;
    next();
  };
}

module.exports = { validate };
