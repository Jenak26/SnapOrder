"use client";

import { useState, useEffect, useCallback } from "react";

export type GeolocationStatus = "idle" | "requesting" | "granted" | "denied" | "fallback";

export interface GeolocationData {
  lat: number;
  lng: number;
  city: string;
  status: GeolocationStatus;
}

const FALLBACK_LOCATION: GeolocationData = {
  lat: 13.0827,
  lng: 80.2707,
  city: "Chennai",
  status: "fallback",
};

const CACHE_KEY = "snaporder_geolocation";

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationData>({
    lat: FALLBACK_LOCATION.lat,
    lng: FALLBACK_LOCATION.lng,
    city: "",
    status: "idle",
  });

  const fetchCityName = async (lat: number, lng: number): Promise<string> => {
    try {
      // Free Nominatim reverse geocoding
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      if (!res.ok) return "Unknown Location";
      const data = await res.json();
      
      // Address shape is varied, try to get the most relevant locality name
      return data.address?.city || 
             data.address?.town || 
             data.address?.village || 
             data.address?.state_district || 
             "Unknown Location";
    } catch {
      return "Unknown Location";
    }
  };

  const requestLocation = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      // Check cache first
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as GeolocationData;
          setLocation(parsed);
          return;
        }
      } catch {
        // Ignore cache errors
      }
    }

    setLocation((prev) => ({ ...prev, status: "requesting" }));

    if (!("geolocation" in navigator)) {
      setLocation(FALLBACK_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const city = await fetchCityName(lat, lng);
        
        const newData: GeolocationData = { lat, lng, city, status: "granted" };
        setLocation(newData);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(newData));
      },
      (error) => {
        console.warn("Geolocation denied or failed:", error);
        setLocation(FALLBACK_LOCATION);
        // We do not cache fallback to allow user to retry if they change permissions
      },
      { timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Request on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...location, requestLocation };
}
