"use client";

import { useEffect, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { loadGoogleMapsScript } from "@/lib/google-maps";

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  icon?: React.ReactNode;
  required?: boolean;
  onSelect: (place: PlaceResult) => void;
  onChange?: (value: string) => void;
  className?: string;
}

const PlacesAutocomplete = forwardRef<HTMLInputElement, Props>(
  ({ label, placeholder, defaultValue = "", icon, required, onSelect, onChange, className }, _ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      let autocomplete: google.maps.places.Autocomplete | null = null;
      let listener: google.maps.MapsEventListener | null = null;

      loadGoogleMapsScript().then(() => {
        if (!inputRef.current || !window.google?.maps?.places) return;

        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "ng" },
          fields: ["formatted_address", "geometry"],
          types: ["geocode", "establishment"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete!.getPlace();
          if (place.geometry?.location) {
            onSelect({
              address: place.formatted_address ?? inputRef.current?.value ?? "",
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        });
      });

      return () => {
        if (listener) window.google?.maps.event.removeListener(listener);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 z-10 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={inputRef}
            defaultValue={defaultValue}
            placeholder={placeholder}
            required={required}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              "w-full rounded-xl border bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition",
              "border-gray-200 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100",
              "dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500",
              "dark:focus:border-orange-400 dark:focus:bg-slate-800 dark:focus:ring-orange-900/40",
              icon && "pl-10",
              className
            )}
          />
        </div>
      </div>
    );
  }
);

PlacesAutocomplete.displayName = "PlacesAutocomplete";
export default PlacesAutocomplete;
