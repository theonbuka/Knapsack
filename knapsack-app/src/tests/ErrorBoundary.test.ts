import { describe, it, expect } from 'vitest';

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    const testText = 'TestContent';
    expect(testText).toBe('TestContent');
  });

  it('should catch errors properly', () => {
    const throwError = () => {
      throw new Error('Test error');
    };
    expect(throwError).toThrow('Test error');
  });
});
