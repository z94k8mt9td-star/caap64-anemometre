import { API_BASE, PUSH_URL, STATION_ID } from '../constants';
import { io, type Socket } from 'socket.io-client';

export interface StationMeta {
  name: string;
  description: string | null;
  picture: string | null;
  date: string | null;
  rating: { upvotes: number; downvotes: number };
}

export interface StationLocation {
  latitude: number | null;
  longitude: number | null;
  date: string | null;
  success: boolean;
}

export interface Measurements {
  date: string | null;
  pressure: number | null;
  wind_heading: number | null;
  wind_speed_avg: number | null;
  wind_speed_max: number | null;
  wind_speed_min: number | null;
}

export interface StationStatus {
  date: string | null;
  snr: number | null;
  state: string | null;
}

export interface LiveStation {
  id: number;
  meta: StationMeta;
  location: StationLocation;
  measurements: Measurements | null;
  status: StationStatus;
}

interface LiveResponse {
  data: LiveStation;
}

export interface PushMeasurement {
  station_id: number;
  type: string;
  data: Measurements & { temperature: number | null; voltage_battery: number | null };
}

export interface ArchivePoint {
  time: Date;
  latitude: number | null;
  longitude: number | null;
  windSpeedMin: number | null;
  windSpeedAvg: number | null;
  windSpeedMax: number | null;
  windHeading: number | null;
}

interface ArchiveResponse {
  legend: string[];
  units: string[];
  data: (string | number | null)[][];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchLiveStation(stationId: number = STATION_ID): Promise<LiveStation> {
  return fetchJson<LiveResponse>(`${API_BASE}/live-with-meta/${stationId}`).then((r) => r.data);
}

export function fetchArchive(
  stationId: number,
  start: Date,
  stop: Date = new Date(),
): Promise<ArchivePoint[]> {
  const params = new URLSearchParams({
    start: start.toISOString(),
    stop: stop.toISOString(),
    format: 'json',
  });
  return fetchJson<ArchiveResponse>(`${API_BASE}/archive/${stationId}?${params.toString()}`).then(
    (r) =>
      (r.data ?? []).map((row) => ({
        time: new Date(String(row[0])),
        latitude: (row[1] as number | null) ?? null,
        longitude: (row[2] as number | null) ?? null,
        windSpeedMin: (row[3] as number | null) ?? null,
        windSpeedAvg: (row[4] as number | null) ?? null,
        windSpeedMax: (row[5] as number | null) ?? null,
        windHeading: (row[6] as number | null) ?? null,
      })),
  );
}

export function connectPush(
  onMeasurement: (m: PushMeasurement) => void,
  stationId: number = STATION_ID,
): Socket {
  const socket = io(PUSH_URL, { transports: ['websocket', 'polling'] });
  socket.on('connect', () => {
    socket.emit('subscribe', stationId);
  });
  socket.on('measurement', (m: PushMeasurement) => {
    if (m && m.station_id === stationId) {
      onMeasurement(m);
    }
  });
  return socket;
}
