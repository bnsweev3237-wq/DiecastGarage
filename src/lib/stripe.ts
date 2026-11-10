import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2024-06-20" });
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
// Memberships stay switched off until the Stripe keys are added.
export const paymentsEnabled = () => !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_MEMBERSHIP_PRICE_ID);
