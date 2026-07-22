const { classify, thresholds } = require('../../../src/utils/thresholds');

describe('classify()', () => {
  it('retorna "normal" para valores abaixo do limiar de alerta', () => {
    expect(classify('temperature', 50)).toBe('normal');
    expect(classify('humidity',    60)).toBe('normal');
    expect(classify('pressure',    5.0)).toBe('normal');
    expect(classify('vibration',   2.0)).toBe('normal');
  });

  it('retorna "warning" para valores entre warn e critical', () => {
    expect(classify('temperature', 75)).toBe('warning');
    expect(classify('pressure',    9.0)).toBe('warning');
    expect(classify('humidity',    85)).toBe('warning');
    expect(classify('vibration',   5.0)).toBe('warning');
  });

  it('retorna "critical" para valores acima do limiar crítico', () => {
    expect(classify('temperature', 95)).toBe('critical');
    expect(classify('vibration',   7)).toBe('critical');
    expect(classify('pressure',    11)).toBe('critical');
    expect(classify('humidity',    95)).toBe('critical');
  });

  it('retorna "warning" no exato limiar de warn', () => {
    expect(classify('temperature', thresholds.temperature.warn)).toBe('warning');
  });

  it('retorna "critical" no exato limiar crítico', () => {
    expect(classify('temperature', thresholds.temperature.critical)).toBe('critical');
  });

  it('retorna "normal" para tipo de sensor desconhecido', () => {
    expect(classify('unknown', 9999)).toBe('normal');
    expect(classify(undefined, 50)).toBe('normal');
  });
});

describe('thresholds config', () => {
  it('tem as quatro chaves esperadas', () => {
    expect(thresholds).toHaveProperty('temperature');
    expect(thresholds).toHaveProperty('pressure');
    expect(thresholds).toHaveProperty('humidity');
    expect(thresholds).toHaveProperty('vibration');
  });

  it('cada sensor tem warn, critical e unit', () => {
    Object.values(thresholds).forEach(t => {
      expect(t).toHaveProperty('warn');
      expect(t).toHaveProperty('critical');
      expect(t).toHaveProperty('unit');
      expect(t.critical).toBeGreaterThan(t.warn);
    });
  });
});
