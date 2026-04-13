import api from './api';

export const PLANS = {
    basic:    { id: 'basic',    name: 'Basic',    price: 149, description: '720p · 1 screen' },
    standard: { id: 'standard', name: 'Standard', price: 499, description: '1080p · 2 screens' },
    premium:  { id: 'premium',  name: 'Premium',  price: 999, description: '4K · 4 screens' }
};

export const PROMO_CODES = {
    STREAM20: 20,
    FIRST50:  50,
    SAVE10:   10
};

export async function processPayment({ planId, amount }) {
    const { data } = await api.post('/payment', { planId, amount });
    if (!data.success) throw new Error(data.message || 'Payment failed');
    return data;
}
