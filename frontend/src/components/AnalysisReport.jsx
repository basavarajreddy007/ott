import { memo } from 'react';
import ScoreBar, { scoreColor } from './ScoreBar';
import RadarChart, { SCORE_LABELS } from './RadarChart';

const CIRCUMFERENCE = 2 * Math.PI * 50;

const AnalysisReport = memo(function AnalysisReport({ analysis, onCopy, copied }) {
    const overall = analysis.overall ?? 0;
    const color = scoreColor(overall);
    const scores = analysis.scores ?? {};

    return (
        <div className="an-report analyzer-result">
            <div className="ai-result-header">
                <div className="ai-result-label analyzer-label">
                    <span className="ai-result-icon">◈</span>
                    Analysis Report
                </div>
                <button className="ai-copy-btn" onClick={onCopy}>
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>

            <div className="an-body">
                <div className="an-top">
                    <div className="an-overall">
                        <svg viewBox="0 0 120 120" className="an-dial">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                            <circle
                                cx="60" cy="60" r="50"
                                fill="none"
                                stroke={color}
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={CIRCUMFERENCE * (1 - overall / 100)}
                                transform="rotate(-90 60 60)"
                                style={{ transition: 'stroke-dashoffset 1s ease' }}
                            />
                            <text x="60" y="56" textAnchor="middle" fontSize="26" fontWeight="700" fill={color} fontFamily="Inter,sans-serif">
                                {overall}
                            </text>
                            <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="Inter,sans-serif">
                                / 100
                            </text>
                        </svg>
                        <p className="an-overall-label">Overall Score</p>
                    </div>

                    <RadarChart scores={scores} />
                </div>

                <div className="an-scores">
                    {Object.entries(scores).map(([k, v]) => (
                        <ScoreBar key={k} label={SCORE_LABELS[k] ?? k} value={v} />
                    ))}
                </div>

                {analysis.summary && (
                    <div className="an-summary">
                        <p>{analysis.summary}</p>
                    </div>
                )}

                <div className="an-lists">
                    <div className="an-list an-list--strengths">
                        <h4 className="an-list-title">
                            <span className="an-list-icon">✓</span> Strengths
                        </h4>
                        <ul>
                            {(analysis.strengths ?? []).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                    <div className="an-list an-list--improvements">
                        <h4 className="an-list-title">
                            <span className="an-list-icon">↑</span> Improvements
                        </h4>
                        <ul>
                            {(analysis.improvements ?? []).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default AnalysisReport;
