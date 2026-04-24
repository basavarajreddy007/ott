import { memo, useMemo } from 'react';

const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 80;
const LEVELS = 4;

export const SCORE_LABELS = {
    tone: 'Tone & Genre',
    characters: 'Characters',
    dialogue: 'Dialogue',
    pacing: 'Pacing',
    structure: 'Plot Structure'
};

const KEYS = Object.keys(SCORE_LABELS);
const STEP = (2 * Math.PI) / KEYS.length;

const angle = i => -Math.PI / 2 + i * STEP;
const point = (i, r) => ({ x: CX + r * Math.cos(angle(i)), y: CY + r * Math.sin(angle(i)) });
const toPoints = pts => pts.map(p => `${p.x},${p.y}`).join(' ');

const RadarChart = memo(function RadarChart({ scores }) {
    const gridPolygons = useMemo(() =>
        Array.from({ length: LEVELS }, (_, l) => toPoints(KEYS.map((_, i) => point(i, R * (l + 1) / LEVELS)))),
    []);

    const { dataPoints, dataPolygon } = useMemo(() => {
        const pts = KEYS.map((k, i) => point(i, R * ((scores[k] ?? 0) / 100)));
        return { dataPoints: pts, dataPolygon: toPoints(pts) };
    }, [scores]);

    return (
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="an-radar">
            {gridPolygons.map((pts, i) => (
                <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            ))}
            {KEYS.map((_, i) => {
                const p = point(i, R);
                return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
            })}
            <polygon points={dataPolygon} fill="rgba(192,132,252,0.2)" stroke="#c084fc" strokeWidth="2" />
            {dataPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#c084fc" />
            ))}
            {KEYS.map((k, i) => {
                const p = point(i, R + 18);
                return (
                    <text key={k} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                        fontSize="9" fill="#64748b" fontFamily="Inter, sans-serif">
                        {SCORE_LABELS[k].split(' ')[0]}
                    </text>
                );
            })}
        </svg>
    );
});

export default RadarChart;
