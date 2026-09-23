import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import OpenStreetMapAdapter from "../../adapters/navigation/OpenStreetMapAdapter";

// Custom Leaflet Markers with clean SVG icons (No ?? characters!)
const driverIcon = new L.DivIcon({
  className: "custom-driver-icon",
  html: `<div style="background-color:#FF521C; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 4px 12px rgba(255,82,28,0.4); border:2.5px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
    </svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const destinationIcon = new L.DivIcon({
  className: "custom-dest-icon",
  html: `<div style="background-color:#10B981; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 4px 12px rgba(16,185,129,0.4); border:2.5px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function MapController({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (center) {
      map.setView(center, 15);
    }
  }, [center, bounds, map]);
  return null;
}

export default function AppMap({ destinationLat, destinationLng, centerLat, centerLng, hideControls = false }) {
  const navigationService = useMemo(() => new OpenStreetMapAdapter(), []);

  const [currentPosition, setCurrentPosition] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routePositions, setRoutePositions] = useState([]);
  const [mapCenter, setMapCenter] = useState([centerLat || 22.5726, centerLng || 88.4337]); // Default Kolkata Salt Lake
  const [mapBounds, setMapBounds] = useState(null);

  const watchIdRef = useRef(null);
  const lastRouteFetchRef = useRef(0);

  function setDestinationByCoords(lat, lng) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      return;
    }

    setDestination({ lat: parsedLat, lng: parsedLng });
  }

  // Handle external centerLat & centerLng changes
  useEffect(() => {
    if (centerLat && centerLng) {
      setMapCenter([Number(centerLat), Number(centerLng)]);
    }
  }, [centerLat, centerLng]);

  useEffect(() => {
    watchIdRef.current = navigationService.watchCurrentPosition(
      (nextPos) => {
        setCurrentPosition(nextPos);
        if (!centerLat && !centerLng) {
          setMapCenter([nextPos.lat, nextPos.lng]);
        }
      },
      (error) => {
        console.error("GPS error:", error);
      }
    );

    return () => {
      navigationService.clearWatch(watchIdRef.current);
    };
  }, [navigationService, centerLat, centerLng]);

  useEffect(() => {
    if (
      destinationLat !== undefined &&
      destinationLng !== undefined &&
      destinationLat !== null &&
      destinationLng !== null
    ) {
      setDestinationByCoords(destinationLat, destinationLng);
    }
  }, [destinationLat, destinationLng]);

  useEffect(() => {
    if (!currentPosition || !destination) return;

    const now = Date.now();
    if (now - lastRouteFetchRef.current < 3000) return;
    lastRouteFetchRef.current = now;

    const fetchRoute = async () => {
      try {
        const route = await navigationService.getRoute(
          currentPosition,
          destination
        );

        if (route && route.geometry && route.geometry.coordinates) {
          const latLngs = route.geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);
          setRoutePositions(latLngs);

          setMapBounds([
            [Math.min(currentPosition.lat, destination.lat), Math.min(currentPosition.lng, destination.lng)],
            [Math.max(currentPosition.lat, destination.lat), Math.max(currentPosition.lng, destination.lng)],
          ]);
        }
      } catch (err) {
        console.error("Route error:", err);
      }
    };

    fetchRoute();
  }, [currentPosition, destination, navigationService]);

  function handleCenterCurrentLocation() {
    if (currentPosition) {
      setMapBounds(null);
      setMapCenter([currentPosition.lat, currentPosition.lng]);
    }
  }

  function handleFitCurrentAndDestination() {
    if (currentPosition && destination) {
      setMapBounds([
        [Math.min(currentPosition.lat, destination.lat), Math.min(currentPosition.lng, destination.lng)],
        [Math.max(currentPosition.lat, destination.lat), Math.max(currentPosition.lng, destination.lng)],
      ]);
    }
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {!hideControls && (
        <div
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={handleCenterCurrentLocation}
            style={{
              padding: "8px 12px",
              border: "none",
              borderRadius: 10,
              background: "#0F172A",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "11px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            Focus My Location
          </button>

          {destination && (
            <button
              onClick={handleFitCurrentAndDestination}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: 10,
                background: "#FF521C",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "11px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              Center The Route
            </button>
          )}
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} bounds={mapBounds} />

        {currentPosition && (
          <Marker
            position={[currentPosition.lat, currentPosition.lng]}
            icon={driverIcon}
          />
        )}

        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
          />
        )}

        {routePositions.length > 0 && (
          <Polyline
            positions={routePositions}
            color="#FF521C"
            weight={5}
            opacity={0.85}
          />
        )}
      </MapContainer>
    </div>
  );
}
