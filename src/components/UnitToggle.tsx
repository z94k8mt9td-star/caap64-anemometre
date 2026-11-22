import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useUnit } from '../context/UnitsContext';
import { theme } from '../theme';
import { UNIT_LABELS, type Unit } from '../utils/wind';

export default function UnitToggle() {
  const { unit, setUnit } = useUnit();
  const units = Object.keys(UNIT_LABELS) as Unit[];

  return (
    <View style={styles.row}>
      {units.map((u) => (
        <TouchableOpacity
          key={u}
          accessibilityRole="button"
          style={[styles.chip, unit === u && styles.chipActive]}
          onPress={() => setUnit(u)}
        >
          <Text style={[styles.label, unit === u && styles.labelActive]}>{UNIT_LABELS[u]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: theme.chip,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: theme.accent,
  },
  label: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#06121F',
  },
});
