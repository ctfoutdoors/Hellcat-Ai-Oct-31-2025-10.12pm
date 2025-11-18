import { useEffect, useRef } from "react";

interface MapViewProps {
  onMapReady: (map: google.maps.Map, google: typeof window.google) => void;
  className?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
}

export function MapView({ 
  onMapReady, 
  className = "w-full h-full", 
  defaultCenter = { lat: 39.8283, lng: -98.5795 }, // Center of USA
  defaultZoom = 4 
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize Google Maps
    const initMap = () => {
      if (!window.google || !mapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      onMapReady(map, window.google);
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, [defaultCenter, defaultZoom, onMapReady]);

  return <div ref={mapRef} className={className} />;
}

declare global {
  interface Window {
    google: typeof google;
  }
}
