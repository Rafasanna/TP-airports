import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function App() {

  const [airports, setAirports] = useState([]);

  useEffect(() => {

    fetch("http://localhost:3000/airports")
      .then((res) => res.json())
      .then((data) => {

        setAirports(data);

      });

  }, []);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{
        height: "100vh",
        width: "100%"
      }}
    >

      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {airports.map((airport) => (

        airport.lat &&
        airport.lng && (

          <Marker
            key={airport._id}
            position={[
              airport.lat,
              airport.lng
            ]}
          >

            <Popup>

              <h3>{airport.name}</h3>

              <p>
                {airport.city}
              </p>

              <strong>
                {airport.iata_faa}
              </strong>

            </Popup>

          </Marker>

        )

      ))}

    </MapContainer>
  );
}

export default App;