const config = require("./env");

if (!config.STRIPE_ENABLED) {
  console.warn("STRIPE_SECRET_KEY not set. Payment features will be disabled (mock mode).");
}

const stripe = config.STRIPE_ENABLED
  ? require("stripe")(config.STRIPE_SECRET_KEY)
  : null;

module.exports = stripe;
