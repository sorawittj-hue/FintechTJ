/**
 * useAlerts Hook
 *
 * Specialized hook for alert management.
 * Provides price alerts, pattern alerts, and notification management.
 *
 * @example
 * const { alerts, addAlert, removeAlert, checkAlerts } = useAlerts();
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useData } from '@/hooks/useData';
import type { Alert } from '@/types';

export interface UseAlertsReturn {
  // Data
  alerts: Alert[];
  activeAlerts: Alert[];
  triggeredAlerts: Alert[];
  alertCount: number;
  activeAlertCount: number;

  // Operations
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  checkAlerts: () => void;

  // Queries
  getAlertsBySymbol: (symbol: string) => Alert[];
  getAlertsByType: (type: Alert['type']) => Alert[];
  hasAlertForSymbol: (symbol: string) => boolean;
}

export function useAlerts(): UseAlertsReturn {
  const { state, actions } = useData();
  const { alerts, prices, isInitialized } = state;
  const { addAlert, removeAlert, toggleAlert, checkAlerts } = actions;

  // Ref to track if we've done initial check
  const hasCheckedRef = useRef(false);

  // Filter active alerts
  const activeAlerts = useMemo(() => {
    return alerts.filter((a) => a.isActive && !a.triggeredAt);
  }, [alerts]);

  // Filter triggered alerts
  const triggeredAlerts = useMemo(() => {
    return alerts.filter((a) => a.triggeredAt);
  }, [alerts]);

  // Counts
  const alertCount = useMemo(() => alerts.length, [alerts.length]);
  const activeAlertCount = useMemo(() => activeAlerts.length, [activeAlerts.length]);

  // Get alerts by symbol
  const getAlertsBySymbol = useCallback(
    (symbol: string): Alert[] => {
      return alerts.filter(
        (a) => a.symbol.toUpperCase() === symbol.toUpperCase()
      );
    },
    [alerts]
  );

  // Get alerts by type
  const getAlertsByType = useCallback(
    (type: Alert['type']): Alert[] => {
      return alerts.filter((a) => a.type === type);
    },
    [alerts]
  );

  // Check if symbol has any active alerts
  const hasAlertForSymbol = useCallback(
    (symbol: string): boolean => {
      return alerts.some(
        (a) =>
          a.symbol.toUpperCase() === symbol.toUpperCase() &&
          a.isActive &&
          !a.triggeredAt
      );
    },
    [alerts]
  );

  // Auto-check alerts when prices change
  useEffect(() => {
    if (isInitialized && activeAlerts.length > 0 && prices.size > 0) {
      checkAlerts();
    }
  }, [prices, activeAlerts.length, isInitialized, checkAlerts]);

  // Initial check after initialization
  useEffect(() => {
    if (isInitialized && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      if (activeAlerts.length > 0) {
        checkAlerts();
      }
    }
  }, [isInitialized, activeAlerts.length, checkAlerts]);

  return useMemo(
    () => ({
      alerts,
      activeAlerts,
      triggeredAlerts,
      alertCount,
      activeAlertCount,
      addAlert,
      removeAlert,
      toggleAlert,
      checkAlerts,
      getAlertsBySymbol,
      getAlertsByType,
      hasAlertForSymbol,
    }),
    [
      alerts,
      activeAlerts,
      triggeredAlerts,
      alertCount,
      activeAlertCount,
      addAlert,
      removeAlert,
      toggleAlert,
      checkAlerts,
      getAlertsBySymbol,
      getAlertsByType,
      hasAlertForSymbol,
    ]
  );
}

export default useAlerts;
