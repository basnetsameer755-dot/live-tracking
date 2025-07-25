import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { ref, push, onValue } from "firebase/database";
import { database } from "./firebase";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const blueIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

let userId = localStorage.getItem("userId");
if (!userId) {
  userId = `user-${Math.floor(Math.random() * 100000)}`;
  localStorage.setItem("userId", userId);
}

function App() {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [userPaths, setUserPaths] = useState({});
  const appStartTime = useRef(Date.now()); 

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = {
          lat: latitude,
          lng: longitude,
          timestamp: Date.now(),
        };
        const userPathRef = ref(database, `livePaths/${userId}`);
        push(userPathRef, location);

        setCurrentPosition([latitude, longitude]);
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const pathRef = ref(database, "livePaths");

    const unsubscribe = onValue(pathRef, (snapshot) => {
      const data = snapshot.val() || {};
      const filteredPaths = {};

      Object.entries(data).forEach(([uid, pathPoints]) => {
        const userTrail = Object.values(pathPoints)
          .filter((p) => p.timestamp >= appStartTime.current) 
          .map((p) => [p.lat, p.lng]);

        if (userTrail.length > 0) {
          filteredPaths[uid] = userTrail;
        }
      });

      setUserPaths(filteredPaths);
    });

    return () => unsubscribe();
  }, []);

  if (!currentPosition) {
    return <div style={{ padding: 20 }}> Waiting for GPS...</div>;
  }

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer
        center={currentPosition}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {Object.entries(userPaths).map(([uid, trail]) => {
          const last = trail[trail.length - 1];
          return (
            <React.Fragment key={uid}>
              <Marker position={last} icon={blueIcon}>
                <Popup>🧍 User: <b>{uid}</b></Popup>
              </Marker>
              {trail.length > 1 && (
                <Polyline positions={trail} color="red" weight={3} opacity={0.8} />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default App;












