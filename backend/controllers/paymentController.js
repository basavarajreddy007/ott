const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const PLANS = {
    basic:    { name: 'Basic',    price: 149 },
    standard: { name: 'Standard', price: 499 },
    premium:  { name: 'Premium',  price: 999 }
};

exports.processPayment = asyncHandler(async (req, res) => {
    const { planId, amount } = req.body;

    if (!planId || !amount) {
        return res.status(400).json({ success: false, message: 'planId and amount are required' });
    }

    const plan = PLANS[planId];
    if (!plan) {
        return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    await User.findByIdAndUpdate(req.user._id, { plan: plan.name });

    res.json({
        success: true,
        transactionId: 'TXN' + Date.now(),
        timestamp: new Date().toISOString(),
        amount,
        planName: plan.name
    });
});
