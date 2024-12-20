// src/tools.ts

type ToolHandler<T> = (args: T) => Promise<unknown>;

export interface Tool<T = any> {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: ToolHandler<T>;
}

interface StockPriceArgs {
  symbol: string;
  interval?: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily';
  outputSize?: 'compact' | 'full';
  dataType?: 'json' | 'csv';
}

interface CompanyFundamentalsArgs {
  symbol: string;
  metrics?: ('overview' | 'income' | 'balance' | 'cash' | 'ratios')[];
}

const AV_BASE_URL = 'https://www.alphavantage.co/query';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

export const tools: Tool[] = [
  {
    name: 'stock_price',
    description: 'Get real-time and historical stock price data from Alpha Vantage',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
        interval: { 
          type: 'string',
          enum: ['1min', '5min', '15min', '30min', '60min', 'daily'],
          description: 'Time interval between data points'
        },
        outputSize: {
          type: 'string',
          enum: ['compact', 'full'],
          description: 'Amount of data to return (compact = last 100 points, full = all data)'
        },
        dataType: {
          type: 'string',
          enum: ['json', 'csv'],
          description: 'Response data format'
        }
      },
      required: ['symbol']
    },
    handler: async (args: StockPriceArgs) => {
      const url = new URL(AV_BASE_URL);
      url.searchParams.append('apikey', process.env.ALPHA_VANTAGE_API_KEY!);
      url.searchParams.append('symbol', args.symbol);
      
      if (args.interval === 'daily') {
        url.searchParams.append('function', 'TIME_SERIES_DAILY');
      } else {
        url.searchParams.append('function', 'TIME_SERIES_INTRADAY');
        url.searchParams.append('interval', args.interval || '5min');
      }
      
      if (args.outputSize) url.searchParams.append('outputsize', args.outputSize);
      if (args.dataType) url.searchParams.append('datatype', args.dataType);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.statusText}`);
      }

      return await response.json();
    }
  },
  {
    name: 'company_fundamentals',
    description: 'Get company fundamental data from Financial Modeling Prep',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['overview', 'income', 'balance', 'cash', 'ratios']
          },
          description: 'Array of fundamental metrics to retrieve'
        }
      },
      required: ['symbol']
    },
    handler: async (args: CompanyFundamentalsArgs) => {
      const metrics = args.metrics || ['overview'];
      const results: Record<string, unknown> = {};

      for (const metric of metrics) {
        let endpoint: string;
        switch (metric) {
          case 'overview':
            endpoint = `/profile/${args.symbol}`;
            break;
          case 'income':
            endpoint = `/income-statement/${args.symbol}`;
            break;
          case 'balance':
            endpoint = `/balance-sheet-statement/${args.symbol}`;
            break;
          case 'cash':
            endpoint = `/cash-flow-statement/${args.symbol}`;
            break;
          case 'ratios':
            endpoint = `/ratios/${args.symbol}`;
            break;
          default:
            continue;
        }

        const url = new URL(`${FMP_BASE_URL}${endpoint}`);
        url.searchParams.append('apikey', process.env.FMP_API_KEY!);

        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`FMP API error for ${metric}: ${response.statusText}`);
        }

        results[metric] = await response.json();
      }

      return results;
    }
  }
];