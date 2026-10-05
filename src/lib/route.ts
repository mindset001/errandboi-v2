import { haversineDistance } from "@/lib/utils";

/**
 * Server-side road distance (km) between two points. Uses Google Distance Matrix
 * when a key is configured, otherwise (or on failure) falls back to haversine.
 * Used to price rides on the server so the client can't dictate the fare.
 */
export async function getRouteDistanceKm(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<number> {
  const fallback = haversineDistance(originLat, originLng, destLat, destLng);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || key === "your_google_maps_api_key") return fallback;

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&key=${key}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const element = data?.rows?.[0]?.elements?.[0];
    if (element?.status !== "OK") return fallback;
    return element.distance.value / 1000;
  } catch {
    return fallback;
  }
}
