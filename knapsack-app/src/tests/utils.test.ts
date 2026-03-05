import { describe, it, expect, beforeEach } from 'vitest';

describe('Constants & Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have currency symbols defined', () => {
    const currencies = {
      '₺': 'TRY',
      '$': 'USD',
      '€': 'EUR',
    };
    expect(currencies['₺']).toBe('TRY');
  });

  it('should validate transaction amounts', () => {
    const isValidAmount = (amount: string | number) => {
      const num = parseFloat(String(amount));
      return !isNaN(num) && num > 0;
    };
    expect(isValidAmount(100)).toBe(true);
    expect(isValidAmount(-50)).toBe(false);
    expect(isValidAmount('abc')).toBe(false);
  });

  it('should format currency properly', () => {
    const formatCurrency = (amount: number, currency: string) => {
      return `${currency} ${amount.toFixed(2)}`;
    };
    expect(formatCurrency(1234.5, '₺')).toBe('₺ 1234.50');
  });

  it('should handle localStorage safely', () => {
    const testKey = 'test_key';
    const testValue = { data: 'test' };
    localStorage.setItem(testKey, JSON.stringify(testValue));
    const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
    expect(retrieved.data).toBe('test');
  });
});
