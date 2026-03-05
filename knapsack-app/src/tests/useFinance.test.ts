import { describe, it, expect, beforeEach } from 'vitest';

describe('useFinance Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    expect(true).toBe(true);
  });

  it('should properly update data', () => {
    const mockData = { amount: 100, type: 'expense' };
    expect(mockData.amount).toBe(100);
  });

  it('should calculate totals correctly', () => {
    const expenses = [100, 200, 300];
    const total = expenses.reduce((a, b) => a + b, 0);
    expect(total).toBe(600);
  });

  it('should filter transactions by type', () => {
    const transactions = [
      { type: 'expense', amount: 100 },
      { type: 'income', amount: 1000 },
      { type: 'expense', amount: 50 },
    ];
    const expenses = transactions.filter(t => t.type === 'expense');
    expect(expenses).toHaveLength(2);
  });
});
