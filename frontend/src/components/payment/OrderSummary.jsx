import { PLANS } from '../../services/paymentService';

export default function OrderSummary({ planId }) {
    const plan = PLANS[planId] || PLANS.basic;

    return (
        <div className="pay-summary">
            <p className="pay-summary__title">Order Summary</p>

            <div className="pay-summary__plan">
                <span className="pay-summary__plan-name">{plan.name}</span>
                <span className="pay-summary__plan-desc">{plan.description}</span>
            </div>

            <div className="pay-summary__rows">
                <div className="pay-summary__row"><span>Plan</span><span>₹{plan.price}</span></div>
                <div className="pay-summary__divider" />
                <div className="pay-summary__row pay-summary__row--total">
                    <span>Total</span><span>₹{plan.price}</span>
                </div>
            </div>
        </div>
    );
}
