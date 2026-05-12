const User = require('../models/User');

const PLANS = {
    basic:    { name: 'Basic',    price: 149 },
    standard: { name: 'Standard', price: 499 },
    premium:  { name: 'Premium',  price: 999 }
};

exports.processPayment = async (req, res) => {
    try {
        const { planId, amount } = req.body;
        if (!planId || !amount) {
            return res.status(400).json({ success: false, error: 'planId and amount are required' });
        }

        const plan = PLANS[planId];
        if (!plan) return res.status(400).json({ success: false, error: 'Invalid plan' });

        await User.findByIdAndUpdate(req.user._id, { plan: plan.name });

        res.json({
            success: true,
            transactionId: `TXN${Date.now()}`,
            timestamp: new Date().toISOString(),
            amount,
            planName: plan.name
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
