import { useState } from 'react';
import { PLANS, PROMO_CODES } from '../../services/paymentService';

export default function OrderSummary({ planId, onDiscountChange }) {
    const plan = PLANS[planId] || PLANS.basic;
    const [promo, setPromo]           = useState('');
    const [applied, setApplied]       = useState(null);
    const [promoError, setPromoError] = useState('');

    const discount = applied ? Math.round(plan.price * applied.pct / 100) : 0;
    const total    = plan.price - discount;

    const applyPromo = () => {
        const code = promo.trim().toUpperCase();
        const pct  = PROMO_CODES[code];
        if (!pct) return setPromoError('Invalid promo code');
        const newDiscount = Math.round(plan.price * pct / 100);
        setApplied({ code, pct });
        setPromo('');
        setPromoError('');
        onDiscountChange?.(newDiscount);
    };

    const removePromo = () => {
        setApplied(null);
        setPromoError('');
        onDiscountChange?.(0);
    };

    return (
        <div className="pay-summary">
            <p className="pay-summary__title">Order Summary</p>

            <div className="pay-summary__plan">
                <span className="pay-summary__plan-name">{plan.name}</span>
                <span className="pay-summary__plan-desc">{plan.description}</span>
            </div>

            <div className="pay-summary__rows">
                <div className="pay-summary__row"><span>Plan</span><span>₹{plan.price}</span></div>
                {applied && (
                    <div className="pay-summary__row pay-summary__row--discount">
                        <span>{applied.code} ({applied.pct}% off)</span>
                        <span>−₹{discount}</span>
                    </div>
                )}
                <div className="pay-summary__divider" />
                <div className="pay-summary__row pay-summary__row--total">
                    <span>Total</span><span>₹{total}</span>
                </div>
            </div>

            <div className="pay-summary__promo">
                {applied ? (
                    <div className="pay-summary__promo-applied">
                        <span>🎉 {applied.code} applied</span>
                        <button type="button" onClick={removePromo}>Remove</button>
                    </div>
                ) : (
                    <>
                        <div className="pay-summary__promo-row">
                            <input className="pay-input pay-input--sm" placeholder="Promo code"
                                value={promo}
                                onChange={e => { setPromo(e.target.value.toUpperCase()); setPromoError(''); }}
                                onKeyDown={e => e.key === 'Enter' && applyPromo()} />
                            <button type="button" className="pay-btn pay-btn--ghost pay-btn--sm" onClick={applyPromo}>
                                Apply
                            </button>
                        </div>
                        {promoError && <p className="pay-field-error">{promoError}</p>}
                    </>
                )}
            </div>
        </div>
    );
}
