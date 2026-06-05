"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  driverId: string;
  pickupLat: number;
  pickupLng: number;
  initialDriverLat: number | null;
  initialDriverLng: number | null;
};

export default function TrackingMap({
  driverId,
  pickupLat,
  pickupLng,
  initialDriverLat,
  initialDriverLng,
}: Props) {
  const supabase = createClient();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const driverMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(
    initialDriverLat && initialDriverLng ? { lat: initialDriverLat, lng: initialDriverLng } : null
  );

  // Init map
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;

      // Fix default icon asset paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = driverPos
        ? [driverPos.lat, driverPos.lng]
        : [pickupLat, pickupLng];

      const map = L.map(mapEl.current!, { zoomControl: true }).setView(center, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // Pickup pin (orange)
      const pickupIcon = L.divIcon({
        className: "",
        html: `<div style="background:#f97316;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([pickupLat, pickupLng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup("Your pickup point");

      // Driver pin (green)
      if (driverPos) {
        const driverIcon = L.divIcon({
          className: "",
          html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon })
          .addTo(map)
          .bindPopup("Your driver");
      }

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update driver marker when position changes
  useEffect(() => {
    if (!mapRef.current || !driverPos) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverPos.lat, driverPos.lng]);
      } else {
        const driverIcon = L.divIcon({
          className: "",
          html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon })
          .addTo(mapRef.current)
          .bindPopup("Your driver");
      }
      mapRef.current.panTo([driverPos.lat, driverPos.lng]);
    });
  }, [driverPos]);

  // Real-time subscription to driver location changes
  useEffect(() => {
    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drivers",
          filter: `id=eq.${driverId}`,
        },
        (payload) => {
          const { latitude, longitude } = payload.new as { latitude: number; longitude: number };
          if (latitude && longitude) setDriverPos({ lat: latitude, lng: longitude });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [driverId, supabase]);

  return (
    <div className="flex flex-col gap-2">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapEl} className="w-full rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700" style={{ height: 280 }} />
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-orange-500 inline-block" />
          Your pickup
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-500 inline-block" />
          {driverPos ? "Driver location (live)" : "Waiting for driver location…"}
        </span>
      </div>
    </div>
  );
}
