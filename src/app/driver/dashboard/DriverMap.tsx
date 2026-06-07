"use client";

import { useEffect, useRef } from "react";

type Props = {
  driverLat: number | null;
  driverLng: number | null;
  pickupLat: number;
  pickupLng: number;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
};

export default function DriverMap({ driverLat, driverLng, pickupLat, pickupLng, dropoffLat, dropoffLng }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const driverMarkerRef = useRef<import("leaflet").Marker | null>(null);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = driverLat && driverLng
        ? [driverLat, driverLng]
        : [pickupLat, pickupLng];

      const map = L.map(mapEl.current!, { zoomControl: true }).setView(center, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const pickupIcon = L.divIcon({
        className: "",
        html: `<div style="background:#f97316;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([pickupLat, pickupLng], { icon: pickupIcon }).addTo(map).bindPopup("Customer pickup");

      if (dropoffLat && dropoffLng) {
        const dropoffIcon = L.divIcon({
          className: "",
          html: `<div style="background:#64748b;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([dropoffLat, dropoffLng], { icon: dropoffIcon }).addTo(map).bindPopup("Customer drop-off");
      }

      if (driverLat && driverLng) {
        const driverIcon = L.divIcon({
          className: "",
          html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        driverMarkerRef.current = L.marker([driverLat, driverLng], { icon: driverIcon })
          .addTo(map)
          .bindPopup("You");
      }

      // Fit all markers in view
      const points: [number, number][] = [[pickupLat, pickupLng]];
      if (dropoffLat && dropoffLng) points.push([dropoffLat, dropoffLng]);
      if (driverLat && driverLng) points.push([driverLat, driverLng]);
      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
      }

      mapRef.current = map;
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move driver marker when GPS updates
  useEffect(() => {
    if (!mapRef.current || !driverLat || !driverLng) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverLat, driverLng]);
      } else {
        const driverIcon = L.divIcon({
          className: "",
          html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        driverMarkerRef.current = L.marker([driverLat, driverLng], { icon: driverIcon })
          .addTo(mapRef.current)
          .bindPopup("You");
      }
    });
  }, [driverLat, driverLng]);

  return (
    <div className="flex flex-col gap-2 mt-3">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapEl} className="w-full rounded-xl overflow-hidden border border-slate-700" style={{ height: 220 }} />
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
          You
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500 inline-block" />
          Pickup
        </span>
        {dropoffLat && dropoffLng && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500 inline-block" />
            Drop-off
          </span>
        )}
      </div>
    </div>
  );
}
