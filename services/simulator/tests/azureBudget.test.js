import { describe, expect, it } from '@jest/globals';
import { assertAzureBudget, estimateDailyMessages } from '../src/azureBudget.js';

describe('Azure message budget', () => {
  it('estimates the documented free-tier scenarios', () => {
    expect(estimateDailyMessages({
      sensorsCount: 8,
      intervalMs: 2000,
      payloadBytes: 190,
    })).toBe(345600);

    expect(estimateDailyMessages({
      sensorsCount: 16,
      intervalMs: 2000,
      payloadBytes: 190,
    })).toBe(691200);

    expect(estimateDailyMessages({
      sensorsCount: 4,
      intervalMs: 60000,
      payloadBytes: 190,
    })).toBe(5760);

    expect(estimateDailyMessages({
      sensorsCount: 8,
      intervalMs: 90000,
      payloadBytes: 190,
    })).toBe(7680);

    expect(estimateDailyMessages({
      sensorsCount: 8,
      intervalMs: 120000,
      payloadBytes: 190,
    })).toBe(5760);
  });

  it('counts each 512-byte block as a billable message', () => {
    expect(estimateDailyMessages({
      sensorsCount: 8,
      intervalMs: 2000,
      payloadBytes: 512,
    })).toBe(345600);

    expect(estimateDailyMessages({
      sensorsCount: 8,
      intervalMs: 2000,
      payloadBytes: 513,
    })).toBe(691200);
  });

  it('rejects invalid estimate inputs', () => {
    expect(() => estimateDailyMessages({
      sensorsCount: 0,
      intervalMs: 2000,
      payloadBytes: 190,
    })).toThrow(/sensorsCount/);

    expect(() => estimateDailyMessages({
      sensorsCount: 8,
      intervalMs: 0,
      payloadBytes: 190,
    })).toThrow(/intervalMs/);

    expect(() => estimateDailyMessages({
      sensorsCount: 8,
      intervalMs: 2000,
      payloadBytes: 0,
    })).toThrow(/payloadBytes/);
  });

  it('blocks over-budget configurations by default', () => {
    expect(() => assertAzureBudget({
      sensorsCount: 8,
      intervalMs: 2000,
      payloadBytes: 190,
      dailyMessageBudget: 8000,
    })).toThrow(/345600 > 8000/);
  });

  it('allows over-budget configurations only with explicit opt-in', () => {
    const result = assertAzureBudget({
      sensorsCount: 8,
      intervalMs: 2000,
      payloadBytes: 190,
      dailyMessageBudget: 8000,
      allowOverage: true,
    });

    expect(result).toEqual({
      dailyMessages: 345600,
      dailyMessageBudget: 8000,
      allowOverage: true,
      blocksPerMessage: 1,
    });
  });
});
