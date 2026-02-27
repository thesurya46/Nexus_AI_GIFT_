// Market Data Service - Simulates Yahoo Finance / Alpha Vantage APIs
// In production, this would connect to real financial data APIs

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  pe?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface PredictionData {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  direction: 'up' | 'down';
  timeframe: '1D' | '1W' | '1M';
  factors: string[];
}

export class MarketService {
  private static readonly API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || '';
  
  static {
    if (!this.API_KEY) {
      console.warn("VITE_FINNHUB_API_KEY is missing from environment variables.");
    }
  }

  private static readonly BASE_URL = 'https://finnhub.io/api/v1';
  private static readonly TRENDING_STOCKS = [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'
  ];

  static async getStockQuote(symbol: string): Promise<StockData> {
    try {
      const response = await fetch(`${this.BASE_URL}/quote?symbol=${symbol}&token=${this.API_KEY}`);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      // Finnhub quote response: c (current price), d (change), dp (percent change), h (high), l (low), o (open), pc (previous close)
      if (data.c === 0 && data.pc === 0) throw new Error('Invalid symbol or missing data');

      return {
        symbol,
        name: this.getStockName(symbol),
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        volume: Math.floor(Math.random() * 10000000) + 1000000, // Mocked for free tier
        marketCap: `${(Math.random() * 2000 + 100).toFixed(1)}B`, // Mocked for free tier
        pe: Math.random() * 40 + 10, // Mocked for free tier
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
      };
    } catch (error) {
      console.warn('Falling back to mock data for quote', symbol);
      return this.getMockStockQuote(symbol);
    }
  }

  static async getMockStockQuote(symbol: string): Promise<StockData> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const basePrice = Math.random() * 500 + 50;
    const change = (Math.random() - 0.5) * 20;
    
    return {
      symbol,
      name: this.getStockName(symbol),
      price: basePrice,
      change,
      changePercent: (change / basePrice) * 100,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: `${(Math.random() * 2000 + 100).toFixed(1)}B`,
      pe: Math.random() * 40 + 10,
      high: basePrice + Math.abs(change),
      low: basePrice - Math.abs(change),
      open: basePrice - change / 2,
      previousClose: basePrice - change,
    };
  }

  static async getChartData(symbol: string, timeframe: string): Promise<ChartDataPoint[]> {
    try {
      const resolution = timeframe === '1D' ? '60' : timeframe === '1W' ? 'D' : 'W';
      const to = Math.floor(Date.now() / 1000);
      let from = to;
      
      if (timeframe === '1D') from -= 86400; // 1 day
      else if (timeframe === '1W') from -= 7 * 86400; // 1 week
      else from -= 30 * 86400; // 1 month

      const response = await fetch(`${this.BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${this.API_KEY}`);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      if (data.s !== 'ok') throw new Error('No data');

      return data.t.map((timestamp: number, index: number) => ({
        time: timeframe === '1D' 
          ? new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(timestamp * 1000).toLocaleDateString(),
        value: data.c[index]
      }));
    } catch (error) {
      console.warn('Falling back to mock data for chart', symbol);
      return this.getMockChartData(symbol, timeframe);
    }
  }

  static async getMockChartData(symbol: string, timeframe: string): Promise<ChartDataPoint[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const points = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
    const basePrice = Math.random() * 500 + 50;
    
    return Array.from({ length: points }, (_, i) => ({
      time: timeframe === '1D' 
        ? `${i}:00` 
        : new Date(Date.now() - (points - i) * 86400000).toLocaleDateString(),
      value: basePrice + (Math.random() - 0.5) * 50,
    }));
  }

  static async getCandleData(symbol: string, timeframe: string): Promise<any[]> {
    try {
      const resolution = timeframe === '1D' ? '60' : timeframe === '1W' ? 'D' : 'W';
      const to = Math.floor(Date.now() / 1000);
      let from = to;
      
      if (timeframe === '1D') from -= 86400; // 1 day
      else if (timeframe === '1W') from -= 7 * 86400; // 1 week
      else from -= 30 * 86400; // 1 month

      const response = await fetch(`${this.BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${this.API_KEY}`);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      if (data.s !== 'ok') throw new Error('No data');

      return data.t.map((timestamp: number, index: number) => ({
        x: new Date(timestamp * 1000),
        y: [data.o[index], data.h[index], data.l[index], data.c[index]]
      }));
    } catch (error) {
      console.warn('Falling back to mock candle data for chart', symbol);
      return this.getMockCandleData(symbol, timeframe);
    }
  }

  static async getMockCandleData(symbol: string, timeframe: string): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const points = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
    let basePrice = Math.random() * 500 + 50;
    
    return Array.from({ length: points }, (_, i) => {
      const open = basePrice + (Math.random() - 0.5) * 10;
      const close = open + (Math.random() - 0.5) * 20;
      const high = Math.max(open, close) + Math.random() * 5;
      const low = Math.min(open, close) - Math.random() * 5;
      basePrice = close;

      return {
        x: new Date(Date.now() - (points - i) * 86400000),
        y: [open, high, low, close]
      };
    });
  }

  static async getTrendingStocks(): Promise<StockData[]> {
    return Promise.all(
      this.TRENDING_STOCKS.map(symbol => this.getStockQuote(symbol))
    );
  }

  static async getPrediction(symbol: string, timeframe: '1D' | '1W' | '1M'): Promise<PredictionData> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get actual current price if possible to base prediction off of
    let currentPrice = 150;
    try {
       const quote = await this.getStockQuote(symbol);
       currentPrice = quote.price;
    } catch(e) {
       currentPrice = Math.random() * 500 + 50;
    }

    const changePercent = (Math.random() - 0.3) * 10; // Bias towards up
    const predictedPrice = currentPrice * (1 + changePercent / 100);
    
    return {
      symbol,
      currentPrice,
      predictedPrice,
      confidence: Math.random() * 30 + 70, // 70-100%
      direction: predictedPrice > currentPrice ? 'up' : 'down',
      timeframe,
      factors: [
        'Strong market momentum',
        'Positive earnings report',
        'Increased institutional buying',
        'Technical indicators bullish',
      ].slice(0, Math.floor(Math.random() * 3) + 2),
    };
  }

  static async searchStocks(query: string): Promise<StockData[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/search?q=${query}&token=${this.API_KEY}`);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      const symbols = data.result
        .filter((r: any) => r.type === 'Common Stock' && !r.symbol.includes('.'))
        .slice(0, 5)
        .map((r: any) => r.symbol);

      if (symbols.length === 0) throw new Error('No symbols found');

      return Promise.all(symbols.map((symbol: string) => this.getStockQuote(symbol)));
    } catch (error) {
      console.warn('Falling back to mock search data');
      return this.getMockSearchStocks(query);
    }
  }

  static async getMockSearchStocks(query: string): Promise<StockData[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const allSymbols = [...this.TRENDING_STOCKS, 'COIN', 'SQ', 'SHOP', 'ROKU'];
    const filtered = allSymbols.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    );
    
    return Promise.all(
      filtered.slice(0, 5).map(symbol => this.getMockStockQuote(symbol))
    );
  }

  private static getStockName(symbol: string): string {
    const names: Record<string, string> = {
      AAPL: 'Apple Inc.',
      GOOGL: 'Alphabet Inc.',
      MSFT: 'Microsoft Corporation',
      AMZN: 'Amazon.com Inc.',
      TSLA: 'Tesla Inc.',
      NVDA: 'NVIDIA Corporation',
      META: 'Meta Platforms Inc.',
      NFLX: 'Netflix Inc.',
      COIN: 'Coinbase Global Inc.',
      SQ: 'Block Inc.',
      SHOP: 'Shopify Inc.',
      ROKU: 'Roku Inc.',
    };
    return names[symbol] || `${symbol} Company`;
  }
}
