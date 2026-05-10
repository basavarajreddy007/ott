import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthDispatch, updateUser } from '../store/index.jsx';

export default function PaymentSuccess() {
    const location = useLocation();
    const navigate  = useNavigate();
    const dispatch  = useAuthDispatch();
    const state     = location.state;

    useEffect(() => {
        if (!state || !state.transactionId) {
            navigate('/', { replace: true });
            return;
        }
        if (state.planName) {
            dispatch(updateUser({ plan: state.planName }));
        }
    }, [dispatch, navigate, state]);

    if (!state || !state.transactionId) {
        return null;
    }

    const date = new Date(state.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    return (
        <div className="pay-page">
            <div className="pay-success-card">
                <div className="pay-success-icon">✓</div>
                <h1 className="pay-success-title">Payment Successful</h1>
                <p className="pay-success-sub">
                    Your <strong>{state.planName}</strong> subscription is now active.
                </p>

                <div className="pay-success-details">
                    <div className="pay-success-row"><span>Transaction ID</span><span className="pay-mono">{state.transactionId}</span></div>
                    <div className="pay-success-row"><span>Amount Paid</span><span>₹{state.amount}</span></div>
                    <div className="pay-success-row"><span>Account</span><span>{state.email}</span></div>
                    <div className="pay-success-row"><span>Date</span><span>{date}</span></div>
                </div>

                <div className="pay-success-actions">
                    <button className="pay-btn pay-btn--primary pay-btn--full" onClick={() => navigate('/')}>
                        Start Watching
                    </button>
                    <button className="pay-btn pay-btn--ghost pay-btn--full" onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
