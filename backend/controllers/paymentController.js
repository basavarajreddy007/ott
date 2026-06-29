const Payment = require("../models/Payment");
const paymentService = require("../services/paymentService");

const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = "usd" } = req.body;
    const paymentIntent = await paymentService.createPaymentIntent(amount, currency, {
      userId: req.user._id.toString(),
    });

    const payment = await Payment.create({
      user: req.user._id,
      amount,
      currency,
      provider: "stripe",
      stripePaymentIntentId: paymentIntent.paymentIntentId,
      status: "pending",
    });

    res.status(200).json({ success: true, data: { clientSecret: paymentIntent.clientSecret, paymentId: payment._id } });
  } catch (error) {
    next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("subscriptionPlan", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const webhook = async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"];
    const event = await paymentService.constructWebhookEvent(req.body, sig);

    switch (event.type) {
      case "payment_intent.succeeded":
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: event.data.object.id },
          { status: "completed" }
        );
        break;
      case "payment_intent.payment_failed":
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: event.data.object.id },
          { status: "failed" }
        );
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPaymentIntent, getPayments, webhook };
