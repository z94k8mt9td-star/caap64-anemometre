import { useCallback, useEffect, useRef, useState } from 'react';

import { connectPush, fetchLiveStation, type LiveStation, type PushMeasurement } from '../api/openwindmap';
import { LIVE_POLL_INTERVAL_MS } from '../constants';

interface UseLiveStation {
  station: LiveStation | null;
  error: string | null;
  refreshing: boolean;
  lastFetch: Date | null;
  refresh: () => Promise<void>;
}

export function useLiveStation(): UseLiveStation {
  const [station, setStation] = useState<LiveStation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchLiveStation();
      if (!mounted.current) return;
      setStation(data);
      setError(null);
      setLastFetch(new Date());
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const initial = setTimeout(() => {
      void refresh();
    }, 0);
    const interval = setInterval(() => {
      void refresh();
    }, LIVE_POLL_INTERVAL_MS);
    return () => {
      mounted.current = false;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    let socket: ReturnType<typeof connectPush> | null = null;
    try {
      socket = connectPush((m: PushMeasurement) => {
        setStation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            measurements: {
              date: m.data.date,
              pressure: m.data.pressure ?? null,
              wind_heading: m.data.wind_heading ?? null,
              wind_speed_avg: m.data.wind_speed_avg ?? null,
              wind_speed_max: m.data.wind_speed_max ?? null,
              wind_speed_min: m.data.wind_speed_min ?? null,
            },
            status: { ...prev.status, date: m.data.date },
          };
        });
      });
    } catch {
      socket = null;
    }
    return () => {
      socket?.disconnect();
    };
  }, []);

  return { station, error, refreshing, lastFetch, refresh: async () => { setRefreshing(true); await refresh(); } };
}
