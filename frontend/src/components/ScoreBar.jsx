import { memo } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export function scoreColor(val) {
    if (val >= 80) return '#22c55e';
    if (val >= 60) return '#38bdf8';
    if (val >= 40) return '#f59e0b';
    return '#ef4444';
}

const ScoreBar = memo(function ScoreBar({ label, value }) {
    const color = scoreColor(value);
    return (
        <div className="an-score-row">
            <div className="an-score-meta">
                <span className="an-score-label">{label}</span>
                <span className="an-score-val" style={{ color }}>{value}</span>
            </div>
            <div className="an-bar-track">
                <div className="an-bar-fill" style={{ width: `${value}%`, background: color }} />
            </div>
        </div>
    );
});

export default ScoreBar;
