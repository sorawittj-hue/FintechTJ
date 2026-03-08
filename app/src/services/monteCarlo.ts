import type { MonteCarloConfig, MonteCarloResult } from '../workers/monteCarlo.worker';

export class MonteCarloService {
  private worker: Worker | null = null;
  private isProcessing = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window !== 'undefined' && window.Worker) {
      this.worker = new Worker(new URL('../workers/monteCarlo.worker.ts', import.meta.url), { type: 'module' });
    }
  }

  public async runSimulation(config: MonteCarloConfig): Promise<MonteCarloResult> {
    if (!this.worker) {
      this.initWorker();
    }
    
    if (!this.worker) {
      throw new Error('Web Workers are not supported in this environment');
    }

    if (this.isProcessing) {
      this.worker.terminate();
      this.initWorker();
    }

    this.isProcessing = true;

    return new Promise((resolve, reject) => {
      if (!this.worker) return reject('Worker not available');

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'SIMULATION_RESULTS') {
          this.isProcessing = false;
          this.worker?.removeEventListener('message', handleMessage);
          resolve(event.data.payload);
        } else if (event.data.type === 'SIMULATION_ERROR') {
          this.isProcessing = false;
          this.worker?.removeEventListener('message', handleMessage);
          reject(new Error(event.data.payload));
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage({ type: 'START_SIMULATION', payload: config });
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isProcessing = false;
    }
  }
}

export const monteCarloService = new MonteCarloService();
