import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { ref, push, onValue } from "firebase/database";
import { database, auth, signInAnonymously, onAuthStateChanged } from "./firebase";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const blueIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function getDistance(loc1, loc2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(loc1.lat)) *
      Math.cos(toRad(loc2.lat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function App() {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [userPaths, setUserPaths] = useState({});
  const appStartTime = useRef(Date.now());
  const lastLocation = useRef(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Sign in anonymously
    signInAnonymously(auth).catch((error) => console.error("Auth Error:", error));

    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = {
          lat: latitude,
          lng: longitude,
          timestamp: Date.now(),
        };

        if (lastLocation.current) {
          const dist = getDistance(lastLocation.current, newLoc);
          if (dist < 1) return; // ignore minor jumps
        }

        lastLocation.current = newLoc;

        const userPathRef = ref(database, `livePaths/${userId}`);
        push(userPathRef, newLoc);

        setCurrentPosition([latitude, longitude]);
      },
      (err) => console.error("GPS Error:", err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userId]);

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
    return <div style={{ padding: 20 }}>Waiting for GPS...</div>;
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
                <Popup>
                  🧍 User: <b>{uid}</b>
                </Popup>
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





