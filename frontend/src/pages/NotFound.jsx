import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '80vh', gap: '16px',
            color: 'var(--text-2)', textAlign: 'center', padding: '24px'
        }}>
            <span style={{ fontSize: '5rem', lineHeight: 1 }}>404</span>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-3)' }}>This page doesn't exist.</p>
            <button
                onClick={() => navigate('/')}
                style={{
                    padding: '10px 28px', background: 'var(--red)', color: '#fff',
                    border: 'none', borderRadius: 'var(--r-md)', fontWeight: 700,
                    fontSize: '0.9rem', cursor: 'pointer'
                }}
            >
                Go Home
            </button>
        </div>
    );
}
