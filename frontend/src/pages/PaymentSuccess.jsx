import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUser } from '../store/index.js';

export default function PaymentSuccess() {
    const { state } = useLocation();
    const navigate  = useNavigate();
    const dispatch  = useDispatch();

    useEffect(() => {
        if (state?.planName) {
            dispatch(updateUser({ plan: state.planName }));
        }
    }, [dispatch, state?.planName]);

    if (!state?.transactionId) {
        navigate('/', { replace: true });
        return null;
    }

    const { transactionId, planName, amount, email, timestamp } = state;
    const date = new Date(timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    return (
        <div className="pay-page">
            <div className="pay-success-card">
                <div className="pay-success-icon">✓</div>
                <h1 className="pay-success-title">Payment Successful</h1>
                <p className="pay-success-sub">
                    Your <strong>{planName}</strong> subscription is now active.
                </p>

                <div className="pay-success-details">
                    <div className="pay-success-row"><span>Transaction ID</span><span className="pay-mono">{transactionId}</span></div>
                    <div className="pay-success-row"><span>Amount Paid</span><span>₹{amount}</span></div>
                    <div className="pay-success-row"><span>Account</span><span>{email}</span></div>
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
