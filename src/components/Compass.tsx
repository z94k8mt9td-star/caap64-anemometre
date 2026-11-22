import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { theme } from '../theme';

const CARDINALS = ['N', 'E', 'S', 'O'];

export default function Compass({ heading, size = 240 }: { heading: number | null; size?: number }) {
  const c = size / 2;
  const r = size / 2 - 6;
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  const flowRotation = heading === null || Number.isNaN(heading) ? 0 : heading + 180;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} fill={theme.chip} stroke={theme.cardBorder} strokeWidth={2} />
        {ticks.map((t) => {
          const rad = ((t - 90) * Math.PI) / 180;
          const major = t % 90 === 0;
          const r1 = r - (major ? 14 : 8);
          const r2 = r - 3;
          return (
            <Line
              key={t}
              x1={c + r1 * Math.cos(rad)}
              y1={c + r1 * Math.sin(rad)}
              x2={c + r2 * Math.cos(rad)}
              y2={c + r2 * Math.sin(rad)}
              stroke={major ? theme.accent : theme.muted}
              strokeWidth={major ? 2.5 : 1.5}
            />
          );
        })}
        {CARDINALS.map((label, i) => {
          const rad = ((i * 90 - 90) * Math.PI) / 180;
          const rr = r - 26;
          return (
            <SvgText
              key={label}
              x={c + rr * Math.cos(rad)}
              y={c + rr * Math.sin(rad) + 6}
              fill={theme.text}
              fontSize={16}
              fontWeight="700"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
        {heading !== null && !Number.isNaN(heading) && (
          <G rotation={heading} origin={`${c},${c}`}>
            <Polygon
              points={`${c},${c - r + 18} ${c - 7},${c - r + 32} ${c + 7},${c - r + 32}`}
              fill={theme.warn}
            />
          </G>
        )}
        <G rotation={flowRotation} origin={`${c},${c}`}>
          <Polygon
            points={`${c},${c - r * 0.62} ${c - 14},${c + r * 0.28} ${c},${c + r * 0.12} ${c + 14},${c + r * 0.28}`}
            fill={theme.accent}
          />
        </G>
        <Circle cx={c} cy={c} r={7} fill={theme.bg} stroke={theme.accent} strokeWidth={2} />
      </Svg>
    </View>
  );
}
