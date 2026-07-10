// Bundled thumbnail photo for each service category — used on the small
// "browse by category" tiles (onboarding, home) so users see a real photo
// instead of a vector icon. Categories without curated photography (e.g.
// cleaning, other) are simply absent here; CategoryTile falls back to the
// tinted icon badge for those.
export const categoryThumbnails = {
  ac:             require("../../assets/images/ac_repair.png"),
  cooler:         require("../../assets/images/cooler_repair.png"),
  fan:            require("../../assets/images/fan_repair.png"),
  tv:             require("../../assets/images/tv_repair.png"),
  fridge:         require("../../assets/images/fridge_repair.png"),
  electrical:     require("../../assets/images/electrical_work.png"),
  appliance:      require("../../assets/images/appliance_repair.png"),
  cleaning:       require("../../assets/images/cleaning.png"),
  plumbing:       require("../../assets/images/plumbing.png"),
  carpentry:      require("../../assets/images/carpentry.png"),
  "pest-control": require("../../assets/images/pest_control.png"),
  painting:       require("../../assets/images/painting.png"),
  laundry:        require("../../assets/images/laundry.png"),
  "car-wash":     require("../../assets/images/car_wash.png"),
  beauty:         require("../../assets/images/beauty.png"),
  grooming:       require("../../assets/images/grooming.png"),
  moving:         require("../../assets/images/moving.png"),
  gardening:      require("../../assets/images/gardening.png"),
};
