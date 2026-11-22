import { useCallback, useEffect, useState } from 'react';

import { fetchArchive, type ArchivePoint } from '../api/openwindmap';
import { STATION_ID } from '../constants';

export interface Period {
  label: string;
  ms: number;
}

export const PERIODS: Period[] = [
  { label: '1 h', ms: 60 * 60 * 1000 },
  { label: '2 h', ms: 2 * 60 * 60 * 1000 },
  { label: '24 h', ms: 24 * 60 * 60 * 1000 },
  { label: '48 h', ms: 48 * 60 * 60 * 1000 },
  { label: '7 j', ms: 7 * 24 * 60 * 60 * 1000 },
];

interface UseArchive {
  points: ArchivePoint[];
  loading: boolean;
  error: string | null;
  periodIndex: number;
  setPeriodIndex: (i: number) => void;
  reload: () => void;
}

export function useArchive(): UseArchive {
  const [points, setPoints] = useState<ArchivePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodIndex, setPeriodIndex] = useState(2);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const period = PERIODS[periodIndex];
      const data = await fetchArchive(STATION_ID, new Date(Date.now() - period.ms));
      setPoints(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [periodIndex]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load, reloadToken]);

  return {
    points,
    loading,
    error,
    periodIndex,
    setPeriodIndex,
    reload: () => setReloadToken((t) => t + 1),
  };
}
