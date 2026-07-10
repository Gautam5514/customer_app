import { absoluteUrl } from "./config";

// Curated premium local photos served from backend per service category.
const CATEGORY_IMAGES = {
  ac: [
    "/uploads/ac_repair.png",
    "/uploads/ac_installation.png",
    "/uploads/ac_deep_cleaning.png"
  ],
  cooler: [
    "/uploads/cooler_repair.png",
    "/uploads/cooler_service.png",
    "/uploads/cooler_installation.png"
  ],
  fan: [
    "/uploads/fan_repair.png",
    "/uploads/fan_installation.png",
    "/uploads/fan_servicing.png"
  ],
  tv: [
    "/uploads/tv_repair.png",
    "/uploads/tv_wall_mounting.png"
  ],
  fridge: [
    "/uploads/fridge_repair.png",
    "/uploads/fridge_gas_refill.png"
  ],
  electrical: [
    "/uploads/electrical_work.png",
    "/uploads/wiring_cabling.png"
  ],
  appliance: [
    "/uploads/appliance_repair.png",
    "/uploads/washing_machine_repair.png"
  ],
  cleaning: [
    "/uploads/cleaning.png"
  ],
  plumbing: [
    "/uploads/plumbing.png"
  ],
  carpentry: [
    "/uploads/carpentry.png"
  ],
  "pest-control": [
    "/uploads/pest_control.png"
  ],
  painting: [
    "/uploads/painting.png"
  ],
  laundry: [
    "/uploads/laundry.png"
  ],
  "car-wash": [
    "/uploads/car_wash.png"
  ],
  beauty: [
    "/uploads/beauty.png"
  ],
  grooming: [
    "/uploads/grooming.png"
  ],
  moving: [
    "/uploads/moving.png"
  ],
  gardening: [
    "/uploads/gardening.png"
  ],
};

// Returns image URLs for a service: its own uploaded images when present,
// otherwise curated premium photos for its category. Always safe to render —
// the carousel degrades to a tinted icon panel if a URL fails to load.
export function serviceImages(service) {
  if (service?.images?.length) return service.images.map(absoluteUrl).filter(Boolean);
  const defaultImages = CATEGORY_IMAGES[service?.category] || [];
  return defaultImages.map(absoluteUrl).filter(Boolean);
}
