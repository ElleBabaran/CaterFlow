import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
  name: string;
  type?: 'event' | 'supplier' | 'shop';
}

interface GeoOpsLeafletMapProps {
  locations?: Location[];
  center?: [number, number];
  zoom?: number;
  onLocationClick?: (location: Location) => void;
}

export const GeoOpsLeafletMap: React.FC<GeoOpsLeafletMapProps> = ({
  locations = [],
  center = [14.5995, 120.9842], // Manila, Philippines default
  zoom = 12,
  onLocationClick
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        className: 'leaflet-tile'
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    Object.keys(markersRef.current).forEach(key => {
      mapRef.current?.removeLayer(markersRef.current[key]);
    });
    markersRef.current = {};

    // Add location markers
    locations.forEach((location, index) => {
      const markerColor = location.type === 'event' ? 'red' : location.type === 'supplier' ? 'blue' : 'green';
      
      const marker = L.marker([location.lat, location.lng], {
        title: location.name,
        opacity: 0.8
      }).bindPopup(`<strong>${location.name}</strong><br/>${location.type || 'Location'}`)
        .addTo(mapRef.current!);

      marker.on('click', () => {
        if (onLocationClick) {
          onLocationClick(location);
        }
      });

      markersRef.current[`${location.lat}-${location.lng}`] = marker;
    });

    return () => {
      // Cleanup on unmount
    };
  }, [locations, center, zoom]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
      className="geo-ops-map"
    />
  );
};
