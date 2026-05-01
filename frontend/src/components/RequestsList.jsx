import '../css/requests.css';

const COLORS = [
    { bg: 'rgba(239,35,60,0.12)',   border: 'rgba(239,35,60,0.3)',   text: '#ff6b7a',  glow: 'rgba(239,35,60,0.25)' },
    { bg: 'rgba(212,168,67,0.12)',  border: 'rgba(212,168,67,0.3)',  text: '#f0c060',  glow: 'rgba(212,168,67,0.2)' },
    { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  text: '#a5b4fc',  glow: 'rgba(99,102,241,0.2)' },
    { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  text: '#6ee7b7',  glow: 'rgba(16,185,129,0.2)' },
    { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  text: '#fcd34d',  glow: 'rgba(245,158,11,0.2)' },
    { bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.3)',  text: '#f9a8d4',  glow: 'rgba(236,72,153,0.2)' },
];

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function RequestsList({ requests }) {
    if (!requests || requests.length === 0) {
        return (
            <div className="req-empty">
                <span>📭</span>
                <p>No requests yet. Be the first to request a title!</p>
            </div>
        );
    }

    return (
        <div className="req-list">
            {requests.map(function(req, i) {
                const color = COLORS[i % COLORS.length];
                const isTop = i === 0;
                const rankIcon = RANK_ICONS[i] || null;

                return (
                    <div
                        key={req._id}
                        className={`req-item${isTop ? ' req-item--top' : ''}`}
                        style={{
                            '--req-bg':     color.bg,
                            '--req-border': color.border,
                            '--req-text':   color.text,
                            '--req-glow':   color.glow,
                        }}
                    >
                        <div className="req-item-rank">
                            {rankIcon
                                ? <span className="req-rank-icon">{rankIcon}</span>
                                : <span className="req-rank-num">#{i + 1}</span>
                            }
                        </div>

                        <div className="req-item-body">
                            <span className="req-item-title">{req.title}</span>
                            <span className="req-item-meta">
                                by {req.requestedBy !== 'Anonymous' ? req.requestedBy.split('@')[0] : 'Anonymous'}
                            </span>
                        </div>

                        <div className="req-item-count">
                            <span className="req-count-num">{req.count}</span>
                            <span className="req-count-label">{req.count === 1 ? 'vote' : 'votes'}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
