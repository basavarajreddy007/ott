const stripe = require("../config/stripe");
const { STRIPE_WEBHOOK_SECRET } = require("../config/env");

class PaymentService {
  async createPaymentIntent(amount, currency = "usd", metadata = {}) {
    if (!stripe) return this._mockPaymentIntent(amount, currency, metadata);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
    });
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async createSubscription(customerId, priceId) {
    if (!stripe) return this._mockSubscription();
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
    return {
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    };
  }

  async createCustomer(email, name) {
    if (!stripe) return `mock_cus_${Date.now()}`;
    const customer = await stripe.customers.create({ email, name });
    return customer.id;
  }

  async cancelSubscription(subscriptionId) {
    if (!stripe) return true;
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  }

  async constructWebhookEvent(payload, signature) {
    if (!stripe) return { type: "payment_intent.succeeded", data: { object: { id: "mock_pi" } } };
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  }

  _mockPaymentIntent(amount, currency, metadata) {
    return {
      clientSecret: `mock_secret_${Date.now()}`,
      paymentIntentId: `mock_pi_${Date.now()}`,
    };
  }

  _mockSubscription() {
    return {
      subscriptionId: `mock_sub_${Date.now()}`,
      clientSecret: `mock_secret_${Date.now()}`,
    };
  }
}

module.exports = new PaymentService();
