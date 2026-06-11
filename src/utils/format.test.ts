import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDateTime, isMatchLocked } from './format';

describe('formatDateTime', () => {
  it('formats a timestamp as "DD-mon, HH:MM"', () => {
    const ts = Timestamp.fromDate(new Date('2026-06-15T18:30:00Z'));
    const result = formatDateTime(ts);
    expect(result).toMatch(/^\d{2}/);
    expect(result).toContain('jun');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('isMatchLocked', () => {
  it('is locked when the locked flag is true, regardless of date', () => {
    const future = Timestamp.fromDate(new Date(Date.now() + 1000 * 60 * 60));
    expect(isMatchLocked({ locked: true, datetime: future })).toBe(true);
  });

  it('is locked when the kickoff time is in the past', () => {
    const past = Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60));
    expect(isMatchLocked({ locked: false, datetime: past })).toBe(true);
  });

  it('is not locked when the flag is false and kickoff is in the future', () => {
    const future = Timestamp.fromDate(new Date(Date.now() + 1000 * 60 * 60));
    expect(isMatchLocked({ locked: false, datetime: future })).toBe(false);
  });
});

describe('formatCurrency', () => {
  it('formats ARS amounts with the $ symbol and thousands separator', () => {
    const result = formatCurrency(1000, 'ARS');
    expect(result).toContain('1.000');
    expect(result).toContain('$');
  });

  it('formats USD amounts with the US$ symbol', () => {
    const result = formatCurrency(1234.5, 'USD');
    expect(result).toContain('1.234,50');
    expect(result).toContain('US$');
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0, 'ARS');
    expect(result).toContain('0,00');
  });
});
