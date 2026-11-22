import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Compass from '../../components/Compass';
import UnitToggle from '../../components/UnitToggle';
import { CLUB_URL, STATION_PAGE_URL } from '../../constants';
import { useUnit } from '../../context/UnitsContext';
import { useLiveStation } from '../../hooks/useLiveStation';
import { theme } from '../../theme';
import { formatDateTime, formatTime, timeAgo } from '../../utils/format';
import { beaufort, compassDirection, formatSpeed, oppositeDirection, UNIT_LABELS } from '../../utils/wind';

export default function LiveScreen() {
  const { station, error, refreshing, lastFetch, refresh } = useLiveStation();
  const { unit } = useUnit();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);

  const m = station?.measurements ?? null;
  const heading = m?.wind_heading ?? null;
  const avg = m?.wind_speed_avg ?? null;
  const b = beaufort(avg);
  const online = station?.status.state === 'on';
  const offline = station?.status.state === 'off';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
    >
      <View style={styles.card}>
        <View style={styles.stationRow}>
          <Text style={styles.stationName}>{station?.meta.name ?? 'CAAP64 (986)'}</Text>
          <View style={[styles.pill, online && styles.pillOn, offline && styles.pillOff]}>
            <View style={[styles.dot, { backgroundColor: online ? theme.good : offline ? theme.bad : theme.muted }]} />
            <Text style={styles.pillText}>{online ? 'En ligne' : offline ? 'Hors ligne' : '—'}</Text>
          </View>
        </View>
        <Text style={styles.muted}>
          Dernier contact : {timeAgo(station?.status.date ? new Date(station.status.date) : null, now)}
          {station?.status.snr != null ? `  ·  SNR ${station.status.snr} dB` : ''}
        </Text>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={18} color={theme.warn} />
          <Text style={styles.errorText}>Impossible de récupérer les données ({error}).</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.card, styles.center]}>
        <Compass heading={heading} size={230} />
        <Text style={styles.speed}>
          {formatSpeed(avg, unit)}
          <Text style={styles.speedUnit}> {UNIT_LABELS[unit]}</Text>
        </Text>
        <Text style={styles.range}>
          min {formatSpeed(m?.wind_speed_min ?? null, unit)} – max {formatSpeed(m?.wind_speed_max ?? null, unit)}{' '}
          {UNIT_LABELS[unit]}
        </Text>
        <Text style={styles.direction}>
          Vent de {compassDirection(heading)}
          {heading !== null ? ` (${Math.round(heading)}°)` : ''} → souffle vers {oppositeDirection(heading)}
        </Text>
        <View style={[styles.beaufort, { borderColor: b.color }]}>
          <Text style={[styles.beaufortText, { color: b.color }]}>
            Force {b.force} · {b.label}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.muted}>Dernière mesure</Text>
          <Text style={styles.infoValue}>{formatDateTime(m?.date ? new Date(m.date) : null)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.muted}>Dernier rafraîchissement</Text>
          <Text style={styles.infoValue}>{formatTime(lastFetch)}</Text>
        </View>
        <Text style={styles.note}>Actualisation toutes les 60 s + mesures en temps réel (API Push OpenWindMap).</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Unité de vent</Text>
        <UnitToggle />
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(STATION_PAGE_URL)}>
          <Ionicons name="open-outline" size={18} color={theme.accent} />
          <Text style={styles.linkText}>Voir la station sur OpenWindMap</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(CLUB_URL)}>
          <Ionicons name="globe-outline" size={18} color={theme.accent} />
          <Text style={styles.linkText}>Site du CAAP64</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: theme.card,
    borderColor: theme.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  center: { alignItems: 'center' },
  stationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stationName: { color: theme.text, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: theme.chip,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  pillOn: { borderColor: theme.good },
  pillOff: { borderColor: theme.bad },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { color: theme.text, fontSize: 12, fontWeight: '600' },
  muted: { color: theme.muted, fontSize: 13, marginTop: 6 },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: theme.bad,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: theme.text, fontSize: 13, flex: 1 },
  retryText: { color: theme.accent, fontWeight: '700', fontSize: 13 },
  speed: { color: theme.text, fontSize: 56, fontWeight: '800', marginTop: 4 },
  speedUnit: { fontSize: 20, fontWeight: '600', color: theme.muted },
  range: { color: theme.muted, fontSize: 15, marginTop: 2 },
  direction: { color: theme.text, fontSize: 15, marginTop: 10, textAlign: 'center' },
  beaufort: {
    marginTop: 10,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  beaufortText: { fontSize: 13, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoValue: { color: theme.text, fontSize: 14, fontWeight: '600' },
  note: { color: theme.muted, fontSize: 12, marginTop: 8 },
  sectionTitle: { color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  linkText: { color: theme.accent, fontSize: 15, fontWeight: '600' },
  separator: { height: 1, backgroundColor: theme.cardBorder },
});
