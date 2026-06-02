import { describe, it, expect } from 'vitest';
import { riskLevelFromScore } from '../fraudScoringEngine.js';

describe('riskLevelFromScore', () => {
  it('safe at <= 30', () => {
    expect(riskLevelFromScore(0)).toBe('safe');
    expect(riskLevelFromScore(30)).toBe('safe');
  });
  it('medium at 31..50', () => {
    expect(riskLevelFromScore(31)).toBe('medium');
    expect(riskLevelFromScore(50)).toBe('medium');
  });
  it('high at > 50', () => {
    expect(riskLevelFromScore(51)).toBe('high');
    expect(riskLevelFromScore(120)).toBe('high');
  });
});
