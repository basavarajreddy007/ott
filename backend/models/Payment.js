const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    required: false,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "USD",
  },
  provider: {
    type: String,
    enum: ["stripe", "razorpay"],
    default: "stripe",
  },
  stripePaymentIntentId: String,
  stripeSubscriptionId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded", "cancelled"],
    default: "pending",
  },
  receiptUrl: String,
  invoiceUrl: String,
}, {
  timestamps: true,
});

paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
