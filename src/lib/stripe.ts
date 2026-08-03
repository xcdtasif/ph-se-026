import Stripe from "stripe";
import config from "../config";

export const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: "2026-07-29.dahlia",
});
