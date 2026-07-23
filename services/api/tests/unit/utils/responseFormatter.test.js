const { successResponse } = require('../../../src/utils/responseFormatter');

describe('Response Formatter', () => {
  describe('successResponse()', () => {
    it('retorna envelope com success: true e data', () => {
      const result = successResponse({ id: 1 });
      expect(result).toEqual({
        success: true,
        data: { id: 1 },
        meta: null,
      });
    });

    it('inclui meta quando fornecido', () => {
      const result = successResponse([{ id: 1 }], { page: 1, total: 10 });
      expect(result).toEqual({
        success: true,
        data: [{ id: 1 }],
        meta: { page: 1, total: 10 },
      });
    });

    it('retorna data null se não fornecido', () => {
      const result = successResponse();
      expect(result).toEqual({
        success: true,
        data: null,
        meta: null,
      });
    });
  });
});
