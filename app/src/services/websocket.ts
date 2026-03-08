/**
 * WebSocket Manager
 *
 * Centralized WebSocket connection management with:
 * - Connection lifecycle management (connect, disconnect, reconnect)
 * - Auto-reconnect with exponential backoff
 * - Heartbeat/ping-pong to detect stale connections
 * - Channel subscription management
 * - Connection state tracking
 * - Message buffering during disconnections
 * - Support for multiple WebSocket sources (Binance, Coinbase, etc.)
 * - Cross-tab synchronization via BroadcastChannel
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// WebSocket sources
export type WebSocketSource = 'binance' | 'coinbase' | 'kraken' | 'custom';

// Message handler type
export type MessageHandler<T = unknown> = (data: T) => void;

// Connection status
export interface ConnectionStatus {
  state: ConnectionState;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  reconnectAttempts: number;
  latency: number;
  error: Error | null;
}

// Subscription info
interface Subscription<T = unknown> {
  channel: string;
  symbols: string[];
  handler: MessageHandler<T>;
  source: WebSocketSource;
}

// Pending message for buffering
interface PendingMessage {
  channel: string;
  data: unknown;
  timestamp: number;
}

// WebSocket configuration
export interface WebSocketConfig {
  source: WebSocketSource;
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  heartbeatInterval: number;
  heartbeatTimeout: number;
  bufferSize: number;
  bufferDuration: number;
  debug: boolean;
}

// Default configurations for different sources
const DEFAULT_CONFIGS: Record<WebSocketSource, Partial<WebSocketConfig>> = {
  binance: {
    reconnectAttempts: 3,
    reconnectDelay: 2000,
    maxReconnectDelay: 10000,
    heartbeatInterval: 30000,
    heartbeatTimeout: 10000,
    bufferSize: 1000,
    bufferDuration: 60000,
  },
  coinbase: {
    reconnectAttempts: 3,
    reconnectDelay: 2000,
    maxReconnectDelay: 10000,
    heartbeatInterval: 30000,
    heartbeatTimeout: 10000,
    bufferSize: 1000,
    bufferDuration: 60000,
  },
  kraken: {
    reconnectAttempts: 3,
    reconnectDelay: 2000,
    maxReconnectDelay: 10000,
    heartbeatInterval: 30000,
    heartbeatTimeout: 10000,
    bufferSize: 1000,
    bufferDuration: 60000,
  },
  custom: {
    reconnectAttempts: 2,
    reconnectDelay: 2000,
    maxReconnectDelay: 10000,
    heartbeatInterval: 30000,
    heartbeatTimeout: 10000,
    bufferSize: 500,
    bufferDuration: 60000,
  },
};

// Source URL builders
const SOURCE_URLS: Record<WebSocketSource, (symbols: string[]) => string> = {
  binance: (symbols) => {
    const streams = symbols.map((s) => `${s.toLowerCase()}usdt@ticker`).join('/');
    return `wss://stream.binance.com:9443/stream?streams=${streams}`;
  },
  coinbase: () => 'wss://ws-feed.exchange.coinbase.com',
  kraken: () => 'wss://ws.kraken.com',
  custom: () => '',
};

// REST API fallback for when WebSocket is blocked
const REST_API_URLS: Record<WebSocketSource, (symbols: string[]) => string> = {
  binance: (symbols) => {
    const symbolList = symbols.map((s) => `${s.toUpperCase()}USDT`).join(',');
    return `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolList.split(',').map(s => `"${s}"`).join(',')}]`;
  },
  coinbase: () => 'https://api.exchange.coinbase.com/products/ticker',
  kraken: () => 'https://api.kraken.com/0/public/Ticker',
  custom: () => '',
};

/**
 * WebSocket Manager Class
 * Manages WebSocket connections with advanced features
 */
export class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private static isWebSocketBlocked = false; // Persistent session flag

  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private subscriptions = new Map<string, Set<Subscription>>();
  private status: ConnectionStatus = {
    state: 'disconnected',
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    reconnectAttempts: 0,
    latency: 0,
    error: null,
  };

  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private messageBuffer: PendingMessage[] = [];
  private pollingIntervalId: ReturnType<typeof setInterval> | null = null;
  private usePollingFallback: boolean = false;

  private eventHandlers = new Map<string, Set<(...args: unknown[]) => void>>();
  private broadcastChannel: BroadcastChannel | null = null;

  private currentSymbols: string[] = [];
  private source: WebSocketSource = 'binance';
  private readonly handleOnline = () => {
    this.log('Network is online, attempting to reconnect');
    if (this.status.state === 'error' || this.status.state === 'disconnected') {
      this.status.reconnectAttempts = 0;
      this.reconnect();
    }
  };

  private constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = this.mergeConfig(config);
    this.initBroadcastChannel();

    // Listen for network coming back online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<WebSocketConfig>): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(config);
    }
    return WebSocketManager.instance;
  }

  /**
   * Reset singleton instance
   */
  static resetInstance(): void {
    WebSocketManager.instance?.destroy();
    WebSocketManager.instance = null;
  }

  /**
   * Merge config with defaults
   */
  private mergeConfig(config: Partial<WebSocketConfig>): WebSocketConfig {
    const source = config.source || 'binance';
    const defaults = DEFAULT_CONFIGS[source];
    return {
      source,
      url: config.url || defaults.url || '',
      reconnectAttempts: config.reconnectAttempts ?? defaults.reconnectAttempts ?? 10,
      reconnectDelay: config.reconnectDelay ?? defaults.reconnectDelay ?? 1000,
      maxReconnectDelay: config.maxReconnectDelay ?? defaults.maxReconnectDelay ?? 30000,
      heartbeatInterval: config.heartbeatInterval ?? defaults.heartbeatInterval ?? 30000,
      heartbeatTimeout: config.heartbeatTimeout ?? defaults.heartbeatTimeout ?? 10000,
      bufferSize: config.bufferSize ?? defaults.bufferSize ?? 1000,
      bufferDuration: config.bufferDuration ?? defaults.bufferDuration ?? 60000,
      debug: config.debug ?? false,
    };
  }

  /**
   * Initialize BroadcastChannel for cross-tab sync
   */
  private initBroadcastChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('websocket-sync');
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (error) {
        this.log('BroadcastChannel not supported', error);
      }
    }
  }

  /**
   * Handle broadcast messages from other tabs
   */
  private handleBroadcastMessage(data: { type: string; payload: unknown }): void {
    switch (data.type) {
      case 'price-update':
        // Price updates are broadcasted and can be used by other contexts
        this.emit('broadcast', data.payload);
        break;
      case 'connection-state':
        // Sync connection state across tabs
        this.emit('state-change', data.payload);
        break;
    }
  }

  /**
   * Broadcast message to other tabs
   */
  private broadcast(type: string, payload: unknown): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type, payload });
    }
  }

  /**
   * Connect to WebSocket
   */
  connect(symbols: string[] = [], source: WebSocketSource = 'binance'): void {
    if (typeof WebSocket === 'undefined') {
      this.log('WebSocket is not supported in this environment, using polling');
      this.startPollingFallback();
      return;
    }

    if (WebSocketManager.isWebSocketBlocked) {
      this.log('WebSocket is known to be blocked, skipping and using polling');
      this.startPollingFallback();
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    if (symbols.length === 0) {
      this.disconnect();
      return;
    }

    this.source = source;
    this.currentSymbols = [...symbols];
    this.config.url = SOURCE_URLS[source](symbols);
    this.config = this.mergeConfig({ ...this.config, source });

    this.updateStatus({ state: 'connecting', error: null });

    if (this.usePollingFallback) {
      this.stopPollingFallback();
    }

    this.createConnection();
  }

  /**
   * Create WebSocket connection
   */
  private createConnection(): void {
    if (WebSocketManager.isWebSocketBlocked) return;

    try {
      this.log('Creating WebSocket connection to', this.config.url);
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => {
        if (this.status.reconnectAttempts >= this.config.reconnectAttempts - 1) {
          this.log('WebSocket connection failed multiple times, flagging as blocked');
          WebSocketManager.isWebSocketBlocked = true;
        }
        this.handleError(error);
      };
      this.ws.onclose = () => this.handleClose();
    } catch (error) {
      this.log('Failed to create WebSocket:', error);
      this.updateStatus({
        state: 'error',
        error: error instanceof Error ? error : new Error('Failed to create WebSocket'),
      });
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open
   */
  private handleOpen(): void {
    this.log('WebSocket connected');
    this.updateStatus({
      state: 'connected',
      lastConnectedAt: new Date(),
      reconnectAttempts: 0,
      error: null,
    });

    // Send subscribe message for Coinbase
    if (this.source === 'coinbase') {
      this.send({
        type: 'subscribe',
        product_ids: this.currentSymbols.map((s) => `${s}-USD`),
        channels: ['ticker'],
      });
    }

    // Start heartbeat
    this.startHeartbeat();

    // Process buffered messages
    this.processBuffer();

    // Emit event
    this.emit('connected', this.status);
    this.broadcast('connection-state', { state: 'connected', timestamp: Date.now() });
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.log('Received message:', data);

      // Handle heartbeat responses
      if (data.type === 'pong' || data.type === 'heartbeat') {
        this.handleHeartbeatResponse();
        return;
      }

      // Transform data based on source
      const transformedData = this.transformMessage(data);
      if (transformedData) {
        // Route to subscribers
        this.routeMessage(transformedData);

        // Buffer message if needed
        this.bufferMessage(transformedData);

        // Broadcast to other tabs
        this.broadcast('price-update', transformedData);

        // Emit general message event
        this.emit('message', transformedData);
      }
    } catch (error) {
      this.log('Error parsing message:', error);
      this.emit('error', error);
    }
  }

  /**
   * Transform message based on source
   */
  private transformMessage(data: Record<string, unknown>): Record<string, unknown> | null {
    switch (this.source) {
      case 'binance':
        if (data.data) {
          const ticker = data.data as Record<string, string>;
          return {
            symbol: ticker.s?.replace('USDT', ''),
            price: parseFloat(ticker.c || '0'),
            change24h: parseFloat(ticker.p || '0'),
            change24hPercent: parseFloat(ticker.P || '0'),
            high24h: parseFloat(ticker.h || '0'),
            low24h: parseFloat(ticker.l || '0'),
            volume24h: parseFloat(ticker.v || '0'),
            quoteVolume24h: parseFloat(ticker.q || '0'),
            source: 'binance',
            timestamp: Date.now(),
          };
        }
        return null;

      case 'coinbase':
        if (data.type === 'ticker') {
          return {
            symbol: (data.product_id as string)?.replace('-USD', ''),
            price: parseFloat((data.price as string) || '0'),
            change24h: 0, // Coinbase ticker doesn't provide 24h change
            change24hPercent: parseFloat((data.daily_change as string) || '0'),
            volume24h: parseFloat((data.volume_24h as string) || '0'),
            source: 'coinbase',
            timestamp: Date.now(),
          };
        }
        return null;

      default:
        return data;
    }
  }

  /**
   * Route message to subscribers
   */
  private routeMessage(data: Record<string, unknown>): void {
    const symbol = (data.symbol as string)?.toUpperCase();
    if (!symbol) return;

    const channelKey = this.getChannelKey(symbol);
    const channelSubs = this.subscriptions.get(channelKey);

    if (channelSubs) {
      channelSubs.forEach((sub) => {
        try {
          sub.handler(data);
        } catch (error) {
          this.log('Error in subscriber handler:', error);
        }
      });
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(error: Event): void {
    this.log('WebSocket error:', error);
    this.updateStatus({
      state: 'error',
      error: new Error('WebSocket connection error'),
    });
    this.emit('error', error);
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(): void {
    this.log('WebSocket closed');
    this.stopHeartbeat();
    this.updateStatus({
      state: 'disconnected',
      lastDisconnectedAt: new Date(),
    });
    this.emit('disconnected', this.status);
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    let delay = this.config.maxReconnectDelay;

    if (this.status.reconnectAttempts >= this.config.reconnectAttempts) {
      this.log('Max reconnection attempts reached, switching to fallback polling mode');
      this.startPollingFallback();
      return;
    } else {
      delay = Math.min(
        this.config.reconnectDelay * Math.pow(2, this.status.reconnectAttempts),
        this.config.maxReconnectDelay
      );
    }

    this.log(`Scheduling reconnect in ${delay}ms (attempt ${this.status.reconnectAttempts + 1})`);
    this.updateStatus({
      state: 'reconnecting',
      reconnectAttempts: this.status.reconnectAttempts + 1,
    });

    this.reconnectTimeoutId = setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  /**
   * Start polling fallback when WebSocket is blocked
   */
  private startPollingFallback(): void {
    this.stopPollingFallback();
    this.usePollingFallback = true;
    this.updateStatus({
      state: 'connected',
      lastConnectedAt: new Date(),
      reconnectAttempts: this.config.reconnectAttempts,
      error: null,
    });
    this.log('Using REST API polling fallback');

    // Poll every 3 seconds
    this.pollingIntervalId = setInterval(() => {
      this.pollRestAPI();
    }, 3000);

    // Do initial poll
    this.pollRestAPI();

    this.emit('connected', this.status);
    this.broadcast('connection-state', { state: 'connected', timestamp: Date.now() });
  }

  /**
   * Poll REST API for price data
   */
  private async pollRestAPI(): Promise<void> {
    if (this.currentSymbols.length === 0) return;

    try {
      const url = REST_API_URLS[this.source](this.currentSymbols);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Transform and route data
      if (Array.isArray(data)) {
        for (const item of data) {
          const transformed = this.transformRestMessage(item);
          if (transformed) {
            this.routeMessage(transformed);
            this.bufferMessage(transformed);
            this.broadcast('price-update', transformed);
            this.emit('message', transformed);
          }
        }
      }
    } catch (error) {
      this.log('Polling error:', error);
    }
  }

  /**
   * Transform REST API message to standard format
   */
  private transformRestMessage(data: Record<string, unknown>): Record<string, unknown> | null {
    if (this.source === 'binance') {
      return {
        symbol: (data.symbol as string)?.replace('USDT', ''),
        price: parseFloat(data.lastPrice as string || '0'),
        change24h: parseFloat(data.priceChange as string || '0'),
        change24hPercent: parseFloat(data.priceChangePercent as string || '0'),
        high24h: parseFloat(data.highPrice as string || '0'),
        low24h: parseFloat(data.lowPrice as string || '0'),
        volume24h: parseFloat(data.volume as string || '0'),
        quoteVolume24h: parseFloat(data.quoteVolume as string || '0'),
        source: 'binance',
        timestamp: Date.now(),
      };
    }
    return data;
  }

  /**
   * Stop polling fallback
   */
  private stopPollingFallback(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
    this.usePollingFallback = false;
  }

  /**
   * Start heartbeat/ping-pong
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatIntervalId = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send ping based on source
        if (this.source === 'binance') {
          // Binance uses native ping/pong frames
          this.ws.send(JSON.stringify({ method: 'ping' }));
        } else {
          this.send({ type: 'ping', timestamp: Date.now() });
        }

        // Set timeout for pong response
        this.heartbeatTimeoutId = setTimeout(() => {
          this.log('Heartbeat timeout - connection may be stale');
          this.ws?.close();
        }, this.config.heartbeatTimeout);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }

  /**
   * Handle heartbeat response
   */
  private handleHeartbeatResponse(): void {
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }

    // Calculate latency
    this.updateStatus({ latency: 0 }); // Simplified for now
  }

  /**
   * Buffer message for disconnected periods
   */
  private bufferMessage(data: Record<string, unknown>): void {
    const now = Date.now();

    // Clean old messages
    this.messageBuffer = this.messageBuffer.filter(
      (msg) => now - msg.timestamp < this.config.bufferDuration
    );

    // Add new message
    this.messageBuffer.push({
      channel: (data.symbol as string) || 'unknown',
      data,
      timestamp: now,
    });

    // Limit buffer size
    if (this.messageBuffer.length > this.config.bufferSize) {
      this.messageBuffer = this.messageBuffer.slice(-this.config.bufferSize);
    }
  }

  /**
   * Process buffered messages after reconnection
   */
  private processBuffer(): void {
    if (this.messageBuffer.length === 0) return;

    this.log(`Processing ${this.messageBuffer.length} buffered messages`);

    // Sort by timestamp
    this.messageBuffer.sort((a, b) => a.timestamp - b.timestamp);

    // Route buffered messages
    this.messageBuffer.forEach((msg) => {
      this.routeMessage(msg.data as Record<string, unknown>);
    });

    // Clear buffer
    this.messageBuffer = [];
  }

  /**
   * Send message to WebSocket
   */
  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.log('Cannot send message - WebSocket not open');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.log('Disconnecting WebSocket');

    // Clear timeouts
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.stopHeartbeat();
    this.stopPollingFallback();

    // Close connection
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.updateStatus({ state: 'disconnected' });
    this.emit('disconnected', this.status);
  }

  /**
   * Subscribe to a channel
   */
  subscribe<T>(
    channel: string,
    symbols: string[],
    handler: MessageHandler<T>,
    source: WebSocketSource = 'binance'
  ): () => void {
    const subscription: Subscription<T> = {
      channel,
      symbols,
      handler: handler as MessageHandler,
      source,
    };

    // Add to subscriptions
    symbols.forEach((symbol) => {
      const key = this.getChannelKey(symbol);
      if (!this.subscriptions.has(key)) {
        this.subscriptions.set(key, new Set());
      }
      this.subscriptions.get(key)!.add(subscription as Subscription);
    });

    // Connect if not already connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const allSymbols = this.getAllSymbols();
      this.connect(allSymbols, source);
    } else if (source === this.source) {
      // Update connection with new symbols if same source
      const allSymbols = this.getAllSymbols();
      if (allSymbols.length !== this.currentSymbols.length) {
        this.disconnect();
        this.connect(allSymbols, source);
      }
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channel, symbols, handler);
    };
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe<T>(channel: string, symbols: string[], handler: MessageHandler<T>): void {
    symbols.forEach((symbol) => {
      const key = this.getChannelKey(symbol);
      const subs = this.subscriptions.get(key);
      if (subs) {
        subs.forEach((sub) => {
          if (sub.channel === channel && sub.handler === (handler as MessageHandler)) {
            subs.delete(sub);
          }
        });
        if (subs.size === 0) {
          this.subscriptions.delete(key);
        }
      }
    });

    // If no more subscriptions, disconnect
    if (this.subscriptions.size === 0) {
      this.disconnect();
    }
  }

  /**
   * Get all subscribed symbols
   */
  private getAllSymbols(): string[] {
    const symbols = new Set<string>();
    this.subscriptions.forEach((subs) => {
      subs.forEach((sub) => {
        sub.symbols.forEach((s) => symbols.add(s));
      });
    });
    return Array.from(symbols);
  }

  /**
   * Get channel key for a symbol
   */
  private getChannelKey(symbol: string): string {
    return symbol.toUpperCase();
  }

  /**
   * Register event handler
   */
  on(event: 'connected' | 'disconnected' | 'error' | 'message' | 'state-change' | 'broadcast', handler: (...args: unknown[]) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emit event
   */
  private emit(event: string, ...args: unknown[]): void {
    this.eventHandlers.get(event)?.forEach((handler) => {
      try {
        handler(...args);
      } catch (error) {
        this.log('Error in event handler:', error);
      }
    });
  }

  /**
   * Get connection status
   */
  getConnectionState(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Update status and emit change
   */
  private updateStatus(updates: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...updates };
    this.emit('state-change', this.status);
  }

  /**
   * Force reconnect
   */
  reconnect(): void {
    this.disconnect();
    const allSymbols = this.getAllSymbols();
    if (allSymbols.length > 0) {
      this.connect(allSymbols, this.source);
    }
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    this.disconnect();
    this.subscriptions.clear();
    this.eventHandlers.clear();
    this.messageBuffer = [];
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
    }
    this.broadcastChannel?.close();
    this.broadcastChannel = null;
    this.stopPollingFallback();
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[WebSocketManager]', ...args);
    }
  }
}

/**
 * React Hook for WebSocket Manager
 */
export function useWebSocket() {
  const manager = useRef(WebSocketManager.getInstance());
  const [status, setStatus] = useState<ConnectionStatus>({
    state: 'disconnected',
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    reconnectAttempts: 0,
    latency: 0,
    error: null,
  });

  useEffect(() => {
    // Get initial status on mount
    setStatus(manager.current.getConnectionState());

    const unsubscribe = manager.current.on('state-change', (...args: unknown[]) => {
      setStatus(args[0] as ConnectionStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback((symbols: string[], source: WebSocketSource = 'binance') => {
    manager.current.connect(symbols, source);
  }, []);

  const disconnect = useCallback(() => {
    manager.current.disconnect();
  }, []);

  const subscribe = useCallback(<T>(channel: string, symbols: string[], handler: MessageHandler<T>, source?: WebSocketSource) => {
    return manager.current.subscribe(channel, symbols, handler, source);
  }, []);

  const reconnect = useCallback(() => {
    manager.current.reconnect();
  }, []);

  return {
    status,
    connect,
    disconnect,
    subscribe,
    reconnect,
    isConnected: status.state === 'connected',
    isConnecting: status.state === 'connecting',
    isReconnecting: status.state === 'reconnecting',
  };
}

export default WebSocketManager;
