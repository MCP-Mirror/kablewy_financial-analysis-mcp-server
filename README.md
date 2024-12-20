# Financial Analysis MCP Server

An MCP server implementation for financial analysis using Alpha Vantage and Financial Modeling Prep APIs.

## Features

- Real-time and historical stock price data
- Company fundamental data including:
  - Company overview
  - Income statements
  - Balance sheets
  - Cash flow statements
  - Financial ratios

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
FMP_API_KEY=your_fmp_api_key_here
```

3. Build and run:
```bash
npm run build
npm start
```

## Available Tools

### stock_price
Get real-time and historical stock price data from Alpha Vantage

Parameters:
- symbol (required): Stock ticker symbol
- interval: Time interval ('1min', '5min', '15min', '30min', '60min', 'daily')
- outputSize: Amount of data ('compact', 'full')
- dataType: Response format ('json', 'csv')

### company_fundamentals
Get company fundamental data from Financial Modeling Prep

Parameters:
- symbol (required): Stock ticker symbol
- metrics: Array of metrics to retrieve ('overview', 'income', 'balance', 'cash', 'ratios')