/// <reference lib="webworker" />

export interface MonteCarloConfig {
  portfolioValue: number;
  assets: {
    symbol: string;
    allocation: number; // 0-100
    volatility: number; // daily volatility %
    type: 'crypto' | 'stock' | 'cash' | string;
  }[];
  iterations: number;
  days: number;
}

export interface MonteCarloResult {
  percentile5th: number; // 95% VaR
  percentile1st: number; // 99% VaR
  worstCase: number;
  bestCase: number;
  median: number;
  paths: number[][]; // sampled paths for visualization
}

// Simple Box-Muller transform for normal distribution
function randomNormal() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'START_SIMULATION') {
    const config: MonteCarloConfig = event.data.payload;
    const { portfolioValue, assets, iterations, days } = config;
    
    // Validate inputs
    if (!assets || assets.length === 0 || portfolioValue <= 0) {
      self.postMessage({ type: 'SIMULATION_ERROR', payload: 'Invalid portfolio data' });
      return;
    }

    const finalValues: number[] = new Array(iterations);
    const sampledPaths: number[][] = [];
    const NUM_SAMPLED_PATHS = 50;

    for (let i = 0; i < iterations; i++) {
      let currentPortfolioValue = portfolioValue;
      const path: number[] = [currentPortfolioValue];
      
      for (let day = 1; day <= days; day++) {
        let dailyReturn = 0;
        
        // Calculate daily return based on weighted assets
        for (const asset of assets) {
          const weight = asset.allocation / 100;
          const drift = 0; // Assume 0 drift for stress testing
          const volDecimal = asset.volatility / 100;
          
          // Random shock
          const shock = randomNormal() * volDecimal;
          dailyReturn += weight * (drift + shock);
        }
        
        currentPortfolioValue *= (1 + dailyReturn);
        
        if (i < NUM_SAMPLED_PATHS) {
          path.push(currentPortfolioValue);
        }
      }
      
      finalValues[i] = currentPortfolioValue;
      if (i < NUM_SAMPLED_PATHS) {
        sampledPaths.push(path);
      }
    }

    // Calculate percentiles
    finalValues.sort((a, b) => a - b);
    
    const percentile1st = finalValues[Math.floor(iterations * 0.01)];
    const percentile5th = finalValues[Math.floor(iterations * 0.05)];
    const worstCase = finalValues[0];
    const bestCase = finalValues[iterations - 1];
    const median = finalValues[Math.floor(iterations * 0.5)];

    self.postMessage({
      type: 'SIMULATION_RESULTS',
      payload: {
        percentile5th,
        percentile1st,
        worstCase,
        bestCase,
        median,
        paths: sampledPaths
      }
    });
  }
});
