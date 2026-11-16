import { describe, it, expect } from 'vitest';
import { QuoteService } from './quoteService';

describe('QuoteService (Motivasyon Cümleleri)', () => {
  it('tarihe göre tutarlı ve deterministik bir söz döndürür', () => {
    const q1 = QuoteService.getDailyQuote('2026-11-13');
    const q2 = QuoteService.getDailyQuote('2026-11-13');
    expect(q1.id).toBe(q2.id);
    expect(q1.text).toBeTruthy();
    expect(q1.author).toBeTruthy();
  });

  it('farklı tarihlerde farklı sözler seçebilir', () => {
    const q1 = QuoteService.getDailyQuote('2026-11-13');
    const q2 = QuoteService.getDailyQuote('2026-11-14');
    expect(q1.text).toBeTruthy();
    expect(q2.text).toBeTruthy();
  });

  it('rastgele geçerli bir söz döndürür', () => {
    const quote = QuoteService.getRandomQuote();
    expect(quote.id).toBeGreaterThanOrEqual(1);
    expect(quote.id).toBeLessThanOrEqual(50);
  });
});
