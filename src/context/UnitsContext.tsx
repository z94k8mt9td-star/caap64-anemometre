import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { type Unit } from '../utils/wind';

const STORAGE_KEY = '@caap64/unit';

interface UnitsContextValue {
  unit: Unit;
  setUnit: (u: Unit) => void;
}

const UnitsContext = createContext<UnitsContextValue>({ unit: 'kmh', setUnit: () => {} });

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<Unit>('kmh');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'kmh' || v === 'ms' || v === 'kt') setUnitState(v);
    }).catch(() => {});
  }, []);

  const setUnit = useCallback((u: Unit) => {
    setUnitState(u);
    AsyncStorage.setItem(STORAGE_KEY, u).catch(() => {});
  }, []);

  const value = useMemo(() => ({ unit, setUnit }), [unit, setUnit]);
  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnit(): UnitsContextValue {
  return useContext(UnitsContext);
}
