import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Fix default marker icon issues with Leaflet inside Vite
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Base API URL configuration, using environment variable or defaulting to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Custom Component for managing Leaflet marker clusters
function MarkerClusterGroup({ airports, apiBaseUrl }) {
  const map = useMap();
  const clusterGroupRef = useRef(null);

  useEffect(() => {
    if (!map || !airports || airports.length === 0) return;

    // Create a new marker cluster group with chunked loading to prevent UI blocking
    const mcg = L.markerClusterGroup({
      chunkedLoading: true,
    });
    clusterGroupRef.current = mcg;

    airports.forEach((airport) => {
      if (!airport.lat || !airport.lng) return;

      const iata = airport.iata_faa || airport.iata_code || airport.iata;
      const marker = L.marker([airport.lat, airport.lng]);

      // Bind an initial popup showing a loading message
      marker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 150px;">
          <h4 style="margin: 0; color: #666; font-weight: normal;">Cargando detalles...</h4>
        </div>
      `);

      // Add click listener to fetch data from backend and increment popularity
      marker.on("click", async () => {
        const popup = marker.getPopup();
        if (!iata) {
          popup.setContent(`
            <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 150px; color: #d93025;">
              <h4 style="margin: 0;">Error</h4>
              <p style="margin: 5px 0 0 0; font-size: 13px;">Código IATA no disponible</p>
            </div>
          `);
          return;
        }

        try {
          const response = await fetch(`${apiBaseUrl}/airports/${iata}`);
          if (!response.ok) {
            throw new Error(`Error ${response.status} al consultar backend`);
          }
          const data = await response.json();

          // Parse country out of the city field if it contains a comma
          let city = data.city || "";
          let country = "";
          if (city.includes(",")) {
            const parts = city.split(",").map((p) => p.trim());
            city = parts[0];
            country = parts[1];
          }

          const content = `
            <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px; line-height: 1.4; color: #333;">
              <h3 style="margin: 0 0 8px 0; color: #1a73e8; font-size: 15px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                ${data.name || "Sin nombre"}
              </h3>
              <p style="margin: 3px 0; font-size: 13px;"><strong>Ciudad:</strong> ${city || "N/A"}</p>
              ${country ? `<p style="margin: 3px 0; font-size: 13px;"><strong>País:</strong> ${country}</p>` : ""}
              <p style="margin: 3px 0; font-size: 13px;"><strong>Código IATA:</strong> ${data.iata_faa || data.iata_code || iata}</p>
              <p style="margin: 3px 0; font-size: 12px; color: #666;">
                <strong>Coords:</strong> ${data.lat?.toFixed(5) || "N/A"}, ${data.lng?.toFixed(5) || "N/A"}
              </p>
            </div>
          `;
          popup.setContent(content);
        } catch (error) {
          console.error("Error fetching airport details:", error);
          popup.setContent(`
            <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 160px; color: #d93025;">
              <h4 style="margin: 0; font-size: 14px;">Error</h4>
              <p style="margin: 5px 0 0 0; font-size: 12px;">No se pudo cargar la información del aeropuerto.</p>
            </div>
          `);
        }
      });

      mcg.addLayer(marker);
    });

    map.addLayer(mcg);

    // Clean up markers and cluster group on component unmount / update
    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, airports, apiBaseUrl]);

  return null;
}

function App() {
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/airports`)
      .then((res) => res.json())
      .then((data) => {
        setAirports(data);
      })
      .catch((err) => {
        console.error("Error fetching all airports list:", err);
      });
  }, []);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{
        height: "100vh",
        width: "100%",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MarkerClusterGroup airports={airports} apiBaseUrl={API_BASE_URL} />
    </MapContainer>
  );
}

export default App;
