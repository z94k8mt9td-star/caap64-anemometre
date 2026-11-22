export type Unit = 'kmh' | 'ms' | 'kt';

export const UNIT_LABELS: Record<Unit, string> = {
  kmh: 'km/h',
  ms: 'm/s',
  kt: 'nœuds',
};

const FACTORS: Record<Unit, number> = {
  kmh: 1,
  ms: 1 / 3.6,
  kt: 1 / 1.852,
};

export function convertSpeed(kmh: number | null, unit: Unit): number | null {
  if (kmh === null || Number.isNaN(kmh)) return null;
  return kmh * FACTORS[unit];
}

export function formatSpeed(kmh: number | null, unit: Unit): string {
  const v = convertSpeed(kmh, unit);
  if (v === null) return '—';
  return `${Math.round(v * 10) / 10}`;
}

const COMPASS_16 = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO',
];

export function compassDirection(heading: number | null): string {
  if (heading === null || Number.isNaN(heading)) return '—';
  const h = ((heading % 360) + 360) % 360;
  return COMPASS_16[Math.round(h / 22.5) % 16];
}

export function oppositeDirection(heading: number | null): string {
  if (heading === null || Number.isNaN(heading)) return '—';
  return compassDirection(heading + 180);
}

export interface Beaufort {
  force: number;
  label: string;
  color: string;
}

const BEAUFORT: { maxKmh: number; label: string; color: string }[] = [
  { maxKmh: 1, label: 'Calme', color: '#94A3B8' },
  { maxKmh: 5, label: 'Très légère brise', color: '#7DD3FC' },
  { maxKmh: 11, label: 'Légère brise', color: '#38BDF8' },
  { maxKmh: 19, label: 'Jolie brise', color: '#34D399' },
  { maxKmh: 28, label: 'Bonne brise', color: '#A3E635' },
  { maxKmh: 38, label: 'Vent frais', color: '#FDE047' },
  { maxKmh: 49, label: 'Vent fort', color: '#FBBF24' },
  { maxKmh: 61, label: 'Grand frais', color: '#FB923C' },
  { maxKmh: 74, label: 'Coup de vent', color: '#F87171' },
  { maxKmh: 88, label: 'Fort coup de vent', color: '#EF4444' },
  { maxKmh: 102, label: 'Tempête', color: '#DC2626' },
  { maxKmh: 117, label: 'Violente tempête', color: '#B91C1C' },
  { maxKmh: Infinity, label: 'Ouragan', color: '#7F1D1D' },
];

export function beaufort(kmh: number | null): Beaufort {
  if (kmh === null || Number.isNaN(kmh)) {
    return { force: 0, label: '—', color: '#94A3B8' };
  }
  for (let i = 0; i < BEAUFORT.length; i += 1) {
    if (kmh < BEAUFORT[i].maxKmh) {
      return { force: i, label: BEAUFORT[i].label, color: BEAUFORT[i].color };
    }
  }
  const last = BEAUFORT[BEAUFORT.length - 1];
  return { force: 12, label: last.label, color: last.color };
}
