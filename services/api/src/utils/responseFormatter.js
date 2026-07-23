/**
 * Formata as respostas de sucesso seguindo o contrato da API.
 * 
 * @param {Object} data - Payload principal da resposta (objeto ou array)
 * @param {Object} [meta=null] - Dados adicionais (paginação, total, etc)
 * @returns {Object} Payload formatado
 */
function successResponse(data = null, meta = null) {
  return {
    success: true,
    data,
    meta
  };
}

module.exports = {
  successResponse
};
