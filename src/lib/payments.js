import { api } from "./api";

// Whether online payments are configured on the server (+ the public key).
export async function fetchPaymentConfig() {
  const { data } = await api.get("/payments/config");
  return data; // { success, enabled, keyId }
}

// Create (or re-issue) a Razorpay order for a booking the caller owns.
export async function createPaymentOrder(bookingId) {
  const { data } = await api.post("/payments/order", { bookingId });
  return data; // { success, keyId, order, booking, prefill }
}

// Confirm a completed checkout — server verifies the signature and marks paid.
export async function verifyPayment(payload) {
  const { data } = await api.post("/payments/verify", payload);
  return data; // { success, booking }
}
