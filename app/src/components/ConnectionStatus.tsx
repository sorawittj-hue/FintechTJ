/**
 * ConnectionStatus Component
 *
 * Displays real-time connection status for WebSocket and data sync.
 * Features:
 * - Online/offline indicator
 * - WebSocket connection status with detailed state
 * - Last update time
 * - Reconnect button
 * - Connection quality indicator
 */

import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/context/useData';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function ConnectionStatus({
  className,
  showLabel = true,
  variant = 'default',
}: ConnectionStatusProps) {
  const { state, actions } = useData();
  const { connectionStatus, lastUpdate } = state;
  const { reconnect } = actions;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle reconnect
  const handleReconnect = useCallback(async () => {
    setIsReconnecting(true);
    try {
      reconnect();
    } finally {
      setTimeout(() => setIsReconnecting(false), 1000);
    }
  }, [reconnect]);

  // Get status color
  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    switch (connectionStatus.state) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    switch (connectionStatus.state) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
      case 'reconnecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  // Get status text
  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    switch (connectionStatus.state) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting (${connectionStatus.reconnectAttempts})`;
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleReconnect}
              disabled={isReconnecting || connectionStatus.state === 'connected'}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                'hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed',
                className
              )}
            >
              <span className={cn('flex items-center', getStatusColor())}>
                {getStatusIcon()}
              </span>
              {showLabel && (
                <span className="text-xs font-medium">{getStatusText()}</span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="space-y-1">
              <p className="font-medium">{getStatusText()}</p>
              <p className="text-xs text-muted-foreground">
                Last update: {formatLastUpdate()}
              </p>
              {connectionStatus.latency > 0 && (
                <p className="text-xs text-muted-foreground">
                  Latency: {connectionStatus.latency}ms
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-3 p-4 border rounded-lg bg-card', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('flex items-center', getStatusColor())}>
              {getStatusIcon()}
            </span>
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconnect}
            disabled={isReconnecting || connectionStatus.state === 'connected'}
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', isReconnecting && 'animate-spin')} />
            Reconnect
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="space-y-0.5">
            <p className="text-muted-foreground">Network Status</p>
            <p className={cn('font-medium', isOnline ? 'text-green-500' : 'text-red-500')}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-muted-foreground">Last Update</p>
            <p className="font-medium">{formatLastUpdate()}</p>
          </div>
          {connectionStatus.reconnectAttempts > 0 && (
            <div className="space-y-0.5">
              <p className="text-muted-foreground">Reconnect Attempts</p>
              <p className="font-medium">{connectionStatus.reconnectAttempts}</p>
            </div>
          )}
          {connectionStatus.latency > 0 && (
            <div className="space-y-0.5">
              <p className="text-muted-foreground">Latency</p>
              <p className="font-medium">{connectionStatus.latency}ms</p>
            </div>
          )}
        </div>

        {!isOnline && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>You are offline. Please check your internet connection.</p>
          </div>
        )}

        {connectionStatus.state === 'error' && connectionStatus.error && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{connectionStatus.error.message}</p>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background',
              className
            )}
          >
            <span className={cn('flex items-center', getStatusColor())}>
              {getStatusIcon()}
            </span>
            {showLabel && (
              <span className="text-sm font-medium">{getStatusText()}</span>
            )}
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                • {formatLastUpdate()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {connectionStatus.state === 'connected' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="font-medium">{getStatusText()}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last update: {formatLastUpdate()}
            </p>
            {connectionStatus.state !== 'connected' && (
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={handleReconnect}
                disabled={isReconnecting}
              >
                <RefreshCw className={cn('h-3 w-3 mr-1', isReconnecting && 'animate-spin')} />
                Reconnect
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConnectionStatus;
