import { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import UnitToggle from '../../components/UnitToggle';
import WindChart, { type ChartPoint } from '../../components/WindChart';
import { useUnit } from '../../context/UnitsContext';
import { PERIODS, useArchive } from '../../hooks/useArchive';
import { theme } from '../../theme';
import { formatSpeed, convertSpeed, UNIT_LABELS } from '../../utils/wind';

export default function HistoryScreen() {
  const { points, loading, error, periodIndex, setPeriodIndex, reload } = useArchive();
  const { unit } = useUnit();

  const chartPoints: ChartPoint[] = useMemo(
    () =>
      points.map((p) => ({
        time: p.time,
        min: convertSpeed(p.windSpeedMin, unit),
        avg: convertSpeed(p.windSpeedAvg, unit),
        max: convertSpeed(p.windSpeedMax, unit),
      })),
    [points, unit],
  );

  const maxGust = useMemo(() => {
    const vals = points.map((p) => p.windSpeedMax).filter((v): v is number => v !== null);
    return vals.length ? Math.max(...vals) : null;
  }, [points]);

  const meanAvg = useMemo(() => {
    const vals = points.map((p) => p.windSpeedAvg).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [points]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.accent} />}
    >
      <View style={styles.row}>
        {PERIODS.map((p, i) => (
          <TouchableOpacity
            key={p.label}
            style={[styles.periodChip, periodIndex === i && styles.periodChipActive]}
            onPress={() => setPeriodIndex(i)}
          >
            <Text style={[styles.periodLabel, periodIndex === i && styles.periodLabelActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Vitesse du vent</Text>
        {loading && points.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.accent} size="large" />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Erreur de chargement ({error})</Text>
            <TouchableOpacity onPress={reload}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : chartPoints.length === 0 ? (
          <Text style={styles.muted}>Aucune donnée sur cette période.</Text>
        ) : (
          <WindChart points={chartPoints} unitLabel={UNIT_LABELS[unit]} />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Unité de vent</Text>
        <UnitToggle />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.card, styles.stat]}>
          <Text style={styles.muted}>Rafale max</Text>
          <Text style={styles.statValue}>
            {formatSpeed(maxGust, unit)} <Text style={styles.statUnit}>{UNIT_LABELS[unit]}</Text>
          </Text>
        </View>
        <View style={[styles.card, styles.stat]}>
          <Text style={styles.muted}>Moyenne</Text>
          <Text style={styles.statValue}>
            {formatSpeed(meanAvg, unit)} <Text style={styles.statUnit}>{UNIT_LABELS[unit]}</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  row: { flexDirection: 'row', gap: 8 },
  periodChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: theme.chip,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  periodChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  periodLabel: { color: theme.muted, fontSize: 13, fontWeight: '600' },
  periodLabelActive: { color: '#06121F' },
  card: {
    backgroundColor: theme.card,
    borderColor: theme.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: { color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  loadingBox: { height: 240, alignItems: 'center', justifyContent: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  errorText: { color: theme.text, fontSize: 13, flex: 1 },
  retryText: { color: theme.accent, fontWeight: '700', fontSize: 13 },
  muted: { color: theme.muted, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1 },
  statValue: { color: theme.text, fontSize: 22, fontWeight: '800', marginTop: 4 },
  statUnit: { fontSize: 13, fontWeight: '600', color: theme.muted },
});
