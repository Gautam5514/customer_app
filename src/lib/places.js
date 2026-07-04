// Location helpers — Google Places for forward search (its strength) and
// Expo's free on-device geocoder for pin -> address (no Google quota spent).
import Constants from "expo-constants";
import * as Location from "expo-location";

const KEY = Constants.expoConfig?.extra?.googleMapsApiKey;
const COUNTRY = "in"; // bias results to India

// India fallback center (used until we know where the user is).
export const DEFAULT_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// A session token groups autocomplete keystrokes + the final details call into
// one billable session — cheaper and recommended by Google. New one per search.
export function newSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Forward search: text -> list of { placeId, primary, secondary }.
export async function searchPlaces(input, sessionToken) {
  if (!input || input.trim().length < 3) return [];
  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(input)}&key=${KEY}` +
    `&components=country:${COUNTRY}&sessiontoken=${sessionToken}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
      console.warn("Places autocomplete:", json.status, json.error_message);
      return [];
    }
    return (json.predictions || []).map((p) => ({
      placeId: p.place_id,
      primary: p.structured_formatting?.main_text || p.description,
      secondary: p.structured_formatting?.secondary_text || "",
    }));
  } catch (e) {
    console.warn("Places autocomplete failed:", e.message);
    return [];
  }
}

// Resolve a chosen prediction -> { lat, lng, fullAddress, city, pincode }.
export async function getPlaceDetails(placeId, sessionToken) {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}&key=${KEY}&sessiontoken=${sessionToken}` +
    `&fields=geometry,formatted_address,address_component,name`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== "OK") {
    throw new Error(json.error_message || json.status);
  }
  const r = json.result;
  return {
    lat: r.geometry?.location?.lat,
    lng: r.geometry?.location?.lng,
    fullAddress: r.formatted_address || r.name || "",
    ...pickCityPincode(r.address_components || []),
  };
}

// Pin / GPS coordinate -> address, using the free on-device geocoder.
export async function reverseGeocode(lat, lng) {
  try {
    const [r] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!r) return { fullAddress: "", city: "", pincode: "" };
    const line = [r.name, r.street, r.district, r.subregion]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(", ");
    return {
      fullAddress: line,
      city: r.city || r.subregion || r.region || "",
      pincode: r.postalCode || "",
    };
  } catch (e) {
    console.warn("Reverse geocode failed:", e.message);
    return { fullAddress: "", city: "", pincode: "" };
  }
}

// Ask for permission and return the device's current { lat, lng }.
export async function getCurrentCoords() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    const err = new Error("Location permission denied");
    err.code = "PERMISSION_DENIED";
    throw err;
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

function pickCityPincode(components) {
  const get = (type) =>
    components.find((c) => c.types.includes(type))?.long_name || "";
  return {
    city:
      get("locality") ||
      get("administrative_area_level_2") ||
      get("administrative_area_level_1"),
    pincode: get("postal_code"),
  };
}
