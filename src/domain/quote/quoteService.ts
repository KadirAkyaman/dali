import quotesData from '../../data/quotes.json';
import { getTodayDateString } from '../date/dateService';

export interface Quote {
  id: number;
  text: string;
  author: string;
}

const QUOTES: Quote[] = quotesData;

export class QuoteService {
  /**
   * Returns a deterministic quote for the specified date
   */
  static getDailyQuote(dateStr: string = getTodayDateString()): Quote {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % QUOTES.length;
    return QUOTES[index];
  }

  /**
   * Returns a random quote
   */
  static getRandomQuote(): Quote {
    const index = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[index];
  }
}
