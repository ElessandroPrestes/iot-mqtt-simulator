const strategyContext = require('../../../src/strategies/thresholdStrategy');

describe('StrategyContext — classify()', () => {
  describe('Temperatura (padrão: warn=70, critical=90)', () => {
    it('classifica como normal abaixo do threshold de warning', () => {
      expect(strategyContext.classify('temperature', 50)).toBe('normal');
    });

    it('classifica como warning no limite exato de warning', () => {
      expect(strategyContext.classify('temperature', 70)).toBe('warning');
    });

    it('classifica como warning entre warning e critical', () => {
      expect(strategyContext.classify('temperature', 80)).toBe('warning');
    });

    it('classifica como critical no limite exato de critical', () => {
      expect(strategyContext.classify('temperature', 90)).toBe('critical');
    });

    it('classifica como critical acima de critical', () => {
      expect(strategyContext.classify('temperature', 100)).toBe('critical');
    });
  });

  describe('Pressão (padrão: warn=8.5, critical=10)', () => {
    it('classifica como normal', () => {
      expect(strategyContext.classify('pressure', 5.0)).toBe('normal');
    });

    it('classifica como warning', () => {
      expect(strategyContext.classify('pressure', 9.0)).toBe('warning');
    });

    it('classifica como critical', () => {
      expect(strategyContext.classify('pressure', 10.5)).toBe('critical');
    });
  });

  describe('Umidade (padrão: warn=80, critical=90)', () => {
    it('classifica como normal', () => {
      expect(strategyContext.classify('humidity', 60)).toBe('normal');
    });

    it('classifica como warning', () => {
      expect(strategyContext.classify('humidity', 85)).toBe('warning');
    });

    it('classifica como critical', () => {
      expect(strategyContext.classify('humidity', 95)).toBe('critical');
    });
  });

  describe('Vibração (padrão: warn=4.5, critical=6.0)', () => {
    it('classifica como normal', () => {
      expect(strategyContext.classify('vibration', 2.0)).toBe('normal');
    });

    it('classifica como warning', () => {
      expect(strategyContext.classify('vibration', 5.0)).toBe('warning');
    });

    it('classifica como critical', () => {
      expect(strategyContext.classify('vibration', 7.0)).toBe('critical');
    });
  });

  describe('Tipo desconhecido', () => {
    it('retorna normal para tipo não mapeado', () => {
      expect(strategyContext.classify('radioatividade', 999)).toBe('normal');
    });
  });
});

describe('StrategyContext — getUnit()', () => {
  it('retorna °C para temperature', () => {
    expect(strategyContext.getUnit('temperature')).toBe('°C');
  });

  it('retorna bar para pressure', () => {
    expect(strategyContext.getUnit('pressure')).toBe('bar');
  });

  it('retorna % para humidity', () => {
    expect(strategyContext.getUnit('humidity')).toBe('%');
  });

  it('retorna mm/s para vibration', () => {
    expect(strategyContext.getUnit('vibration')).toBe('mm/s');
  });

  it('retorna string vazia para tipo desconhecido', () => {
    expect(strategyContext.getUnit('desconhecido')).toBe('');
  });
});
