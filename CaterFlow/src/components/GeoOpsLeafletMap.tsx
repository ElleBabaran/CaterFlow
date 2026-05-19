import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2 } from "lucide-react";
import { WorkspaceRole } from "../lib/firebase";
import { inferVenueCoordinates } from "../services/knowledgeBase";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  role: WorkspaceRole;
  customer: any;
  inventory: any;
  logistics: any;
};

export function GeoOpsLeafletMap({ role, customer, inventory, logistics }: Props) {
  const [venue, setVenue] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(true);

  useEffect(() => {
    let isActive = true;
    setLoadingCoords(true);
    inferVenueCoordinates(customer?.location || "")
      .then((coords) => {
        if (isActive) {
          setVenue(coords);
          setLoadingCoords(false);
        }
      })
      .catch((err) => {
        console.error("Failed to infer venue coordinates:", err);
        if (isActive) {
          setVenue({ lat: 14.59, lng: 121.02 }); // default fallback coordinates
          setLoadingCoords(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [customer?.location]);

  const suppliers = useMemo(
    () => (inventory?.supplier_matches?.length ? inventory.supplier_matches.slice(0, 3) : []),
    [inventory?.supplier_matches],
  );
  const cateringShops = useMemo(
    () => (inventory?.catering_shop_recommendations?.length ? inventory.catering_shop_recommendations.slice(0, 3) : []),
    [inventory?.catering_shop_recommendations],
  );

  const points = role === "customer" ? cateringShops : suppliers;
  const firstPoint = points[0];
  const targetPoint = firstPoint && typeof firstPoint.lat === "number" && typeof firstPoint.lng === "number"
    ? { lat: firstPoint.lat, lng: firstPoint.lng }
    : null;
  const [route, setRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    let isActive = true;
    if (!targetPoint || !venue) {
      setRoute([]);
      return;
    }

    const run = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${venue.lng},${venue.lat};${targetPoint.lng},${targetPoint.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("route request failed");
        const payload = await response.json();
        const coordinates = payload?.routes?.[0]?.geometry?.coordinates;
        if (!isActive || !Array.isArray(coordinates)) return;
        setRoute(coordinates.map((coord: number[]) => [coord[1], coord[0]]));
      } catch {
        if (isActive) setRoute([]);
      }
    };

    run();
    return () => {
      isActive = false;
    };
  }, [targetPoint?.lat, targetPoint?.lng, venue?.lat, venue?.lng]);

  return (
    <div className="high-density-card flex flex-col">
      <div className="high-density-header">
        <div>
          <h2 className="high-density-label">{role === "customer" ? "Event Map" : "Operations Map"}</h2>
          <p className="text-[10px] text-slate-500 mt-1">OSM map with supplier/shop and optional route preview.</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-56 overflow-hidden rounded-2xl border border-slate-100">
          {loadingCoords || !venue ? (
            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
              <span>Calculating Map Coordinates...</span>
            </div>
          ) : (
            <MapContainer center={[venue.lat, venue.lng]} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[venue.lat, venue.lng]}>
                <Popup>Venue: {customer?.location || "Event venue"}</Popup>
              </Marker>
              {points.map((point: any, idx: number) => (
                typeof point.lat === "number" && typeof point.lng === "number" ? (
                  <Marker key={`${point.name}-${idx}`} position={[point.lat, point.lng]}>
                    <Popup>{point.name || "Candidate"}</Popup>
                  </Marker>
                ) : null
              ))}
              {route.length > 0 && <Polyline positions={route} />}
            </MapContainer>
          )}
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-[10px] text-slate-600">
          {logistics?.delivery_windows?.[0] || "Route window will appear once logistics are generated."}
        </div>
      </div>
    </div>
  );
}
