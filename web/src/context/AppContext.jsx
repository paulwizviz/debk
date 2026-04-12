import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, BUSINESS_ID } from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [business, setBusiness] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [activePeriodId, setActivePeriodId] = useState(() => {
    const v = window.sessionStorage.getItem('debk_active_period_id');
    return v ? parseInt(v, 10) || '' : '';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshBusiness = useCallback(async () => {
    const list = await apiGet('/api/business');
    const b = (list || []).find((x) => x.id === BUSINESS_ID) || list?.[0];
    setBusiness(b || null);
  }, []);

  const refreshPeriods = useCallback(async () => {
    const list = await apiGet('/api/periods');
    setPeriods(list || []);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refreshBusiness(), refreshPeriods()]);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [refreshBusiness, refreshPeriods]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!periods.length) return;
    const ok = periods.some((p) => p.id === activePeriodId);
    if (ok) return;
    const open = periods.find((p) => !p.is_closed);
    setActivePeriodId(open?.id ?? periods[0]?.id ?? '');
  }, [periods, activePeriodId]);

  useEffect(() => {
    if (activePeriodId !== '' && activePeriodId != null) {
      window.sessionStorage.setItem('debk_active_period_id', String(activePeriodId));
    }
  }, [activePeriodId]);

  const activePeriod = useMemo(
    () => periods.find((p) => p.id === activePeriodId) || null,
    [periods, activePeriodId],
  );

  const value = useMemo(
    () => ({
      business,
      currency: business?.functional_currency || 'GBP',
      periods,
      activePeriodId,
      setActivePeriodId,
      activePeriod,
      loading,
      error,
      refreshAll,
      refreshPeriods,
      refreshBusiness,
    }),
    [
      business,
      periods,
      activePeriodId,
      activePeriod,
      loading,
      error,
      refreshAll,
      refreshPeriods,
      refreshBusiness,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
