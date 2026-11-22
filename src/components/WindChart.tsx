import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { theme } from '../theme';

export interface ChartPoint {
  time: Date;
  min: number | null;
  avg: number | null;
  max: number | null;
}

interface Props {
  points: ChartPoint[];
  unitLabel: string;
  height?: number;
}

export default function WindChart({ points, unitLabel, height = 240 }: Props) {
  const [width, setWidth] = useState(0);
  const pad = { top: 18, right: 10, bottom: 26, left: 46 };

  if (width === 0) {
    return <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} />;
  }

  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const n = points.length;

  const maxV = Math.max(10, ...points.map((p) => p.max ?? p.avg ?? 0)) * 1.15;
  const x = (i: number) => pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / maxV) * innerH;

  const linePath = (values: (number | null)[]): string => {
    let d = '';
    let pen = false;
    values.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };

  const areaPath = (values: (number | null)[]): string => {
    const valid = values.map((v, i) => ({ v, i })).filter((p) => p.v !== null) as { v: number; i: number }[];
    if (valid.length === 0) return '';
    const base = pad.top + innerH;
    const top = valid.map((p) => `${p.i === valid[0].i ? 'M' : 'L'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const last = valid[valid.length - 1];
    const first = valid[0];
    return `${top} L${x(last.i).toFixed(1)},${base} L${x(first.i).toFixed(1)},${base} Z`;
  };

  const gridTicks = [0, 1, 2, 3].map((t) => (maxV * t) / 3);

  const spanMs = n > 1 ? points[n - 1].time.getTime() - points[0].time.getTime() : 0;
  const longFormat = spanMs > 24 * 3600 * 1000;
  const labelFor = (d: Date) =>
    longFormat
      ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
        ' ' +
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const tickCount = Math.min(5, n);
  const tickIndices = Array.from({ length: tickCount }, (_, k) =>
    n === 1 ? 0 : Math.round((k / (tickCount - 1)) * (n - 1)),
  );

  const fmt = (v: number) => `${Math.round(v * 10) / 10}`;

  return (
    <View>
      <Svg width={width} height={height}>
        {gridTicks.map((v) => (
          <Line
            key={v}
            x1={pad.left}
            y1={y(v)}
            x2={width - pad.right}
            y2={y(v)}
            stroke={theme.cardBorder}
            strokeWidth={1}
            strokeDasharray={v === 0 ? undefined : '4 4'}
          />
        ))}
        {gridTicks.map((v) => (
          <SvgText key={`t${v}`} x={pad.left - 8} y={y(v) + 4} fill={theme.muted} fontSize={10} textAnchor="end">
            {fmt(v)}
          </SvgText>
        ))}
        <Path d={areaPath(points.map((p) => p.max))} fill="rgba(56, 189, 248, 0.18)" />
        <Path d={linePath(points.map((p) => p.max))} fill="none" stroke={theme.accent} strokeWidth={2} />
        <Path d={linePath(points.map((p) => p.avg))} fill="none" stroke={theme.text} strokeWidth={2.5} />
        <Path
          d={linePath(points.map((p) => p.min))}
          fill="none"
          stroke={theme.muted}
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        {n > 0 && points[n - 1].avg !== null && (
          <Circle cx={x(n - 1)} cy={y(points[n - 1].avg as number)} r={3.5} fill={theme.text} />
        )}
        {tickIndices.map((i) => (
          <SvgText key={i} x={x(i)} y={height - 8} fill={theme.muted} fontSize={10} textAnchor="middle">
            {labelFor(points[i].time)}
          </SvgText>
        ))}
      </Svg>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <Text style={styles.legendText}>max {unitLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.text }]} />
          <Text style={styles.legendText}>moyen {unitLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.muted }]} />
          <Text style={styles.legendText}>min {unitLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: theme.muted,
    fontSize: 12,
  },
});
