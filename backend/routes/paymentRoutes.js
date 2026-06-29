const express = require("express");
const router = express.Router();
const { createPaymentIntent, getPayments, webhook } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/create-payment-intent", protect, createPaymentIntent);
router.get("/", protect, getPayments);
router.post("/webhook", express.raw({ type: "application/json" }), webhook);

module.exports = router;
