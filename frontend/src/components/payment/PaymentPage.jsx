import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import PaymentMethods from './PaymentMethods';
import OrderSummary from './OrderSummary';
import { processPayment, PLANS } from '../../services/paymentService';
import '../../css/payment.css';

function validateCard(d) {
    const e = {};
    if (!d.name.trim())                          e.name   = 'Name is required';
    if (d.number.replace(/\s/g, '').length < 13) e.number = 'Enter a valid card number';
    if (!d.expiry || d.expiry.length < 5)        e.expiry = 'Enter expiry as MM/YY';
    if (!d.cvv || d.cvv.length < 3)              e.cvv    = 'Enter a valid CVV';
    return e;
}

const PLAN_IDS = ['basic', 'standard', 'premium'];

export default function PaymentPage() {
    const navigate        = useNavigate();
    const location        = useLocation();
    const { email, user } = useSelector(s => s.auth);

    const initPlan = location.state?.plan || new URLSearchParams(location.search).get('plan') || 'standard';
    const [planId, setPlanId]         = useState(PLAN_IDS.includes(initPlan) ? initPlan : 'standard');
    const [discount, setDiscount]     = useState(0);
    const [method, setMethod]         = useState('card');
    const [card, setCard]             = useState({ name: user?.username || '', number: '', expiry: '', cvv: '' });
    const [cardErrors, setCardErrors] = useState({});
    const [upi, setUpi]               = useState('');
    const [upiError, setUpiError]     = useState('');
    const [wallet, setWallet]         = useState('');
    const [walletError, setWalletError] = useState('');
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');

    const planPrice = (PLANS[planId] || PLANS.standard).price;
    const total     = planPrice - discount;

    const handlePlanChange = (id) => {
        setPlanId(id);
        setDiscount(0);
    };

    const validate = () => {
        setCardErrors({}); setUpiError(''); setWalletError('');
        if (method === 'card') {
            const e = validateCard(card);
            if (Object.keys(e).length) { setCardErrors(e); return false; }
        }
        if (method === 'upi' && !/^[\w.\-]+@[\w]+$/.test(upi.trim())) {
            setUpiError('Enter a valid UPI ID'); return false;
        }
        if (method === 'wallet' && !wallet) { setWalletError('Select a wallet'); return false; }
        return true;
    };

    const handlePay = async () => {
        if (!validate()) return;
        setError('');
        setLoading(true);
        try {
            const result = await processPayment({ planId, amount: total });
            navigate('/payment-success', { state: { ...result, email } });
        } catch (err) {
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pay-page">
            <div className="pay-container">
                <div className="pay-header">
                    <button type="button" className="pay-back-btn" onClick={() => navigate(-1)} aria-label="Go back">←</button>
                    <div>
                        <h1 className="pay-page-title">Complete Payment</h1>
                        <p className="pay-page-sub">{email}</p>
                    </div>
                </div>

                <div className="pay-plan-selector">
                    {PLAN_IDS.map(id => {
                        const p = PLANS[id];
                        return (
                            <button key={id} type="button"
                                className={`pay-plan-card${planId === id ? ' active' : ''}`}
                                onClick={() => handlePlanChange(id)}>
                                {id === 'standard' && <span className="pay-plan-card__popular">Popular</span>}
                                <span className="pay-plan-card__name">{p.name}</span>
                                <span className="pay-plan-card__price">₹{p.price}<small>/mo</small></span>
                                <span className="pay-plan-card__desc">{p.description}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="pay-layout">
                    <div className="pay-left">
                        <PaymentMethods
                            method={method} onMethodChange={m => { setMethod(m); setError(''); }}
                            cardData={card} onCardChange={setCard} cardErrors={cardErrors}
                            upiId={upi} onUpiChange={v => { setUpi(v); setUpiError(''); }} upiError={upiError}
                            wallet={wallet} onWalletChange={v => { setWallet(v); setWalletError(''); }} walletError={walletError}
                        />

                        {error && <div className="pay-alert pay-alert--error">{error}</div>}

                        <button type="button" className="pay-btn pay-btn--primary pay-btn--full"
                            onClick={handlePay} disabled={loading}>
                            {loading ? 'Processing…' : `Pay ₹${total}`}
                        </button>
                    </div>

                    <div className="pay-right">
                        <OrderSummary planId={planId} onDiscountChange={setDiscount} />
                    </div>
                </div>
            </div>
        </div>
    );
}
