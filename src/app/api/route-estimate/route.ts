import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const originLat = searchParams.get("originLat");
  const originLng = searchParams.get("originLng");
  const destLat = searchParams.get("destLat");
  const destLng = searchParams.get("destLng");

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Fall back to haversine if no API key configured
  if (!key || key === "your_google_maps_api_key") {
    const distanceKm = haversine(
      parseFloat(originLat), parseFloat(originLng),
      parseFloat(destLat), parseFloat(destLng)
    );
    return NextResponse.json({ distanceKm, durationMinutes: null, source: "haversine" });
  }

  const origin = `${originLat},${originLng}`;
  const destination = `${destLat},${destLng}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&departure_time=now&key=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();

    const element = data?.rows?.[0]?.elements?.[0];
    if (element?.status !== "OK") {
      throw new Error(element?.status ?? "No route found");
    }

    const distanceKm = element.distance.value / 1000;
    // duration_in_traffic is only available with a premium Maps plan + departure_time=now
    const durationSeconds =
      element.duration_in_traffic?.value ?? element.duration.value;
    const durationMinutes = Math.ceil(durationSeconds / 60);

    return NextResponse.json({ distanceKm, durationMinutes, source: "google" });
  } catch (err) {
    // If Google call fails, fall back silently
    const distanceKm = haversine(
      parseFloat(originLat), parseFloat(originLng),
      parseFloat(destLat), parseFloat(destLng)
    );
    return NextResponse.json({ distanceKm, durationMinutes: null, source: "haversine", error: String(err) });
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
