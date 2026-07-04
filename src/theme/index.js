// EliteCrew design tokens — premium, restrained, slightly-rounded.
// Monochrome ink palette matching the web app's near-black primary.

export const colors = {
  // Brand ink
  ink: "#0A0A0A",
  inkSoft: "#1A1A1A",
  // Surfaces
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F6F6F7",
  surfaceSunken: "#F1F1F3",
  // Text
  text: "#0A0A0A",
  textMuted: "#6B6B72",
  textFaint: "#9A9AA2",
  textOnInk: "#FFFFFF",
  // Lines (crisp hairlines — the flat look relies on these instead of shadows)
  border: "#E6E6EA",
  borderStrong: "#D7D7DC",
  // Accents (used sparingly)
  gold: "#C8A45C",
  goldSoft: "#F5EEDD",
  // Status
  success: "#1A7F4B",
  successSoft: "#E7F4ED",
  warning: "#B7791F",
  warningSoft: "#FBF1DC",
  danger: "#C0392B",
  dangerSoft: "#FBEAE7",
  info: "#2A5BD7",
  infoSoft: "#E8EEFC",
};

// Classic EliteCrew radius — one restrained, consistent corner everywhere.
// Cards, buttons, inputs and tiles all share `md`/`lg`; only big surfaces use
// the slightly larger `xl`. Nothing is bubbly.
export const radii = {
  sm: 8,
  md: 10,
  lg: 10,
  xl: 12,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const font = {
  // System font stack — clean and native on both platforms.
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 17,
    xl: 20,
    xxl: 23,
    display: 27,
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    heavy: "800",
  },
};

// Classic, flat surfaces — no drop shadows. Definition comes from crisp
// hairline borders instead. Kept as empty objects so existing `...shadow.card`
// spreads stay valid everywhere.
export const shadow = {
  card: {},
  soft: {},
};

// Maps a booking status to its display label + tone.
export const statusMeta = {
  pending: { label: "Finding a pro", tone: "warning" },
  accepted: { label: "Pro assigned", tone: "info" },
  provider_on_way: { label: "On the way", tone: "info" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  disputed: { label: "Disputed", tone: "danger" },
};

// Service category → MaterialCommunityIcons glyph + accent (rendered via
// <CategoryIcon>). Vector icons keep the UI crisp at any size, and the `color`
// + soft `tint` give each category a recognisable, premium identity.
export const categoryMeta = {
  ac:         { label: "AC Repair",     icon: "air-conditioner", color: "#2563EB", tint: "#E8EFFE" }, // wall AC unit · blue
  cooler:     { label: "Air Cooler",    icon: "snowflake",       color: "#0EA5A4", tint: "#E3F6F5" }, // snowflake · teal
  fan:        { label: "Fan",           icon: "fan",             color: "#7C5CFC", tint: "#EEEAFE" }, // fan blades · violet
  tv:         { label: "Television",    icon: "television",      color: "#DB2777", tint: "#FBE8F1" }, // TV · rose
  fridge:     { label: "Refrigerator",  icon: "fridge-outline",  color: "#16A34A", tint: "#E6F5EC" }, // fridge · green
  electrical: { label: "Electrical",    icon: "power-plug",      color: "#D97706", tint: "#FBF0DC" }, // plug · amber
  appliance:  { label: "Appliance",     icon: "washing-machine", color: "#475569", tint: "#EEF1F5" }, // washing machine · slate
  cleaning:   { label: "Cleaning",      icon: "broom",           color: "#059669", tint: "#E5F5EF" }, // broom · emerald
  other:      { label: "More Services", icon: "toolbox-outline", color: "#6B7280", tint: "#F0F1F3" }, // toolbox · grey
};

export default { colors, radii, spacing, font, shadow, statusMeta, categoryMeta };
