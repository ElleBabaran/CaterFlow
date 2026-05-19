import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Truck, Check } from "lucide-react";
import { inferVenueCoordinates } from "../../services/knowledgeBase";

// Custom truck icon definition
const truckIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048314.png", // Flat truck icon
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19]
});

const venueIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1865/1865269.png", // Luxury venue/pin icon
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Helper component to auto-pan / auto-fit bounds when route updates
function MapController({ route }: { route: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      map.fitBounds(route, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
}

const isValidCoordinate = (coords: any): coords is { lat: number; lng: number } => {
  return typeof coords === 'object' && 
         coords !== null && 
         typeof coords.lat === 'number' && !isNaN(coords.lat) && 
         typeof coords.lng === 'number' && !isNaN(coords.lng);
};

const isValidLatLngTuple = (coords: any): coords is [number, number] => {
  return Array.isArray(coords) && 
         coords.length === 2 && 
         typeof coords[0] === 'number' && !isNaN(coords[0]) && 
         typeof coords[1] === 'number' && !isNaN(coords[1]);
};

type Props = {
  status: 'prep' | 'transit' | 'arrived' | 'setup' | 'completed';
  venueLocation: string;
  shopCoords?: { lat: number; lng: number };
};

export function CustomerTrackingMap({ status, venueLocation, shopCoords }: Props) {
  const [venue, setVenue] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [animIndex, setAnimIndex] = useState(0);

  // Shop coordinate (Kitchen start point)
  const kitchen = useMemo(() => {
    if (isValidCoordinate(shopCoords)) return shopCoords;
    return { lat: 14.65, lng: 121.03 }; // default kitchen coordinates (Quezon City)
  }, [shopCoords]);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    inferVenueCoordinates(venueLocation)
      .then((coords) => {
        if (isActive) {
          if (isValidCoordinate(coords)) {
            setVenue(coords);
          } else {
            setVenue({ lat: 14.59, lng: 121.02 });
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setVenue({ lat: 14.59, lng: 121.02 }); // Default Manila fallback
          setLoading(false);
        }
      });
    return () => { isActive = false; };
  }, [venueLocation]);

  // Fetch OSRM route from kitchen to venue
  useEffect(() => {
    let isActive = true;
    if (!venue || !isValidCoordinate(venue) || !isValidCoordinate(kitchen)) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${kitchen.lng},${kitchen.lat};${venue.lng},${venue.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (isActive && Array.isArray(coords)) {
          const mappedCoords: [number, number][] = coords
            .map((c: number[]) => [c[1], c[0]])
            .filter((tuple) => isValidLatLngTuple(tuple)) as [number, number][];
          setRoute(mappedCoords);
          
          // Set initial vehicle position
          if (status === 'prep') {
            setCurrentPos([kitchen.lat, kitchen.lng]);
          } else if (status === 'transit' && mappedCoords.length > 0) {
            setCurrentPos(mappedCoords[0]);
            setAnimIndex(0);
          } else {
            setCurrentPos([venue.lat, venue.lng]);
          }
        }
      } catch (err) {
        console.error("OSRM Route fetching failed:", err);
      }
    };

    fetchRoute();
    return () => { isActive = false; };
  }, [venue, kitchen, status]);

  // Simulate smooth moving truck if status is 'transit'
  useEffect(() => {
    if (status !== 'transit' || route.length === 0 || !venue || !isValidCoordinate(venue)) return;

    const interval = setInterval(() => {
      setAnimIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= route.length) {
          if (isValidCoordinate(venue)) {
            setCurrentPos([venue.lat, venue.lng]);
          }
          return prev; // stays at destination
        }
        const nextPos = route[nextIndex];
        if (isValidLatLngTuple(nextPos)) {
          setCurrentPos(nextPos);
        }
        return nextIndex;
      });
    }, 2000); // Shift truck location along polyline every 2 seconds

    return () => clearInterval(interval);
  }, [status, route, venue]);

  if (loading || !venue || !isValidCoordinate(venue)) {
    return (
      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span>Syncing Live GPS Signal...</span>
      </div>
    );
  }

  const centerPos: [number, number] = [venue.lat, venue.lng];

  return (
    <div className="w-full h-full relative">
      <MapContainer center={centerPos} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Kitchen/Shop Marker */}
        {isValidCoordinate(kitchen) && (
          <Marker position={[kitchen.lat, kitchen.lng]}>
            <Popup>Catering HQ (Kitchen & Dispatch)</Popup>
          </Marker>
        )}

        {/* Venue/Destination Marker */}
        {isValidCoordinate(venue) && (
          <Marker position={[venue.lat, venue.lng]} icon={venueIcon}>
            <Popup>Your Venue: {venueLocation}</Popup>
          </Marker>
        )}

        {/* Vehicle (Truck) Marker */}
        {isValidLatLngTuple(currentPos) && (
          <Marker position={currentPos} icon={truckIcon}>
            <Popup>
              {status === 'prep' && "FEAST PREPARATION UNDERWAY"}
              {status === 'transit' && `DISPATCHED IN TRANSIT - EST SPEED: 45KM/H`}
              {status === 'arrived' && "FEAST ARRIVED AT VENUE"}
              {status === 'setup' && "BUFFET SETUP ACTIVE"}
              {status === 'completed' && "EVENT ACTIVE / HAPPY FEASTING!"}
            </Popup>
          </Marker>
        )}

        {/* Route Polyline preview */}
        {route.length > 0 && (
          <Polyline positions={route} pathOptions={{ color: '#d97706', weight: 4, opacity: 0.8, dashArray: '8, 8' }} />
        )}

        {route.length > 0 && <MapController route={route} />}
      </MapContainer>

      {/* Modern floating status indicator */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-100 z-[1000] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Truck className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Driver Coordinates</span>
            <p className="text-[10px] font-bold text-slate-800">
              {isValidLatLngTuple(currentPos) ? `${currentPos[0].toFixed(4)}° N, ${currentPos[1].toFixed(4)}° E` : "Calibrating..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100">
          <Check className="w-3 h-3" />
          <span>Verified GPS Feed</span>
        </div>
      </div>
    </div>
  );
}
