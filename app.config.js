// Single source of truth for the Google Maps / Places / Geocoding key.
// Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in the environment (or .env) — never
// hardcode the key here. Use a key restricted to this app's bundle id.
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default {
  expo: {
    name: "EliteCrew",
    slug: "elitecrew-customer",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/elitecrew-favicon.png",
    scheme: "elitecrew",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/elitecrew-logo.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A0A",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "in.elitecrew.customer",
      config: {
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: "in.elitecrew.customer",
      adaptiveIcon: {
        backgroundColor: "#0A0A0A",
        foregroundImage: "./assets/elitecrew-favicon.png",
      },
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: "./assets/elitecrew-favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "EliteCrew uses your location to find services near you and fill in your address automatically.",
        },
      ],
    ],
    extra: {
      router: {},
      // Read in JS via Constants.expoConfig.extra.googleMapsApiKey
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    },
  },
};
