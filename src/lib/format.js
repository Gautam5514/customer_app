import dayjs from "dayjs";

export function inr(n) {
  const v = Number(n || 0);
  return `₹${v.toLocaleString("en-IN")}`;
}

export function fmtDate(d) {
  if (!d) return "";
  return dayjs(d).format("ddd, D MMM");
}

export function fmtDateTime(d) {
  if (!d) return "";
  return dayjs(d).format("ddd, D MMM · h:mm A");
}

export function fmtTimeSlot(slot) {
  if (!slot) return "";
  // "09:00" -> "9:00 AM"
  const [h, m] = String(slot).split(":").map(Number);
  if (Number.isNaN(h)) return slot;
  return dayjs().hour(h).minute(m || 0).format("h:mm A");
}

export function fromNow(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return dayjs(d).format("D MMM");
}

// Mirrors the server-side pricing math so the customer sees an accurate
// breakdown before confirming (server recomputes authoritatively).
export function quote(basePrice, discount = 0) {
  const base = Number(basePrice || 0);
  const platformFee = Math.round(base * 0.1);
  const tax = Math.round((base + platformFee) * 0.18);
  const total = Math.max(0, base + platformFee + tax - discount);
  return { base, platformFee, tax, discount, total };
}

export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
