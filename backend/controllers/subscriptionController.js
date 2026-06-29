const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const Payment = require("../models/Payment");
const paymentService = require("../services/paymentService");
const { sendSubscriptionConfirmation } = require("../services/emailService");

const getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

const getPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, message: "Plan created", data: plan });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.status(200).json({ success: true, message: "Plan updated", data: plan });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.status(200).json({ success: true, message: "Plan deleted" });
  } catch (error) {
    next(error);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const user = await User.findById(req.user._id);
    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      customerId = await paymentService.createCustomer(user.email, user.name);
      user.subscription.stripeCustomerId = customerId;
      await user.save({ validateModifiedOnly: true });
    }

    const subscription = await paymentService.createSubscription(customerId, plan.stripePriceId);

    const payment = await Payment.create({
      user: user._id,
      subscriptionPlan: plan._id,
      amount: plan.price,
      currency: plan.currency,
      provider: "stripe",
      stripeSubscriptionId: subscription.subscriptionId,
      status: "pending",
    });

    user.subscription.plan = plan._id;
    user.subscription.status = "active";
    user.subscription.startDate = new Date();
    user.subscription.endDate = new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000);
    user.subscription.stripeSubscriptionId = subscription.subscriptionId;
    await user.save({ validateModifiedOnly: true });

    const confirmResult = await sendSubscriptionConfirmation(user.email, plan.name, plan.price);
    if (!confirmResult.success) {
      console.error("Subscription - confirmation email failed:", confirmResult.error);
    }

    res.status(200).json({
      success: true,
      message: "Subscription successful",
      data: { subscription, payment, clientSecret: subscription.clientSecret },
    });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.subscription?.stripeSubscriptionId) {
      return res.status(400).json({ success: false, message: "No active subscription" });
    }

    await paymentService.cancelSubscription(user.subscription.stripeSubscriptionId);

    user.subscription.status = "cancelled";
    user.subscription.endDate = new Date();
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({ success: true, message: "Subscription cancelled" });
  } catch (error) {
    next(error);
  }
};

const getUserSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("subscription.plan");
    if (!user.subscription?.plan) {
      return res.status(200).json({ success: true, data: null });
    }
    res.status(200).json({ success: true, data: user.subscription });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlans, getPlan, createPlan, updatePlan, deletePlan, subscribe, cancelSubscription, getUserSubscription };
