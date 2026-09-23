import NavigationService from "./NavigationService";

export default class OpenStreetMapAdapter extends NavigationService {
  watchCurrentPosition(onSuccess, onError, options = {}) {
    if (!navigator.geolocation) {
      onError?.(new Error("Geolocation is not supported by this browser."));
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
      },
      (error) => {
        onError?.(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
        ...options,
      }
    );
  }

  clearWatch(watchId) {
    if (watchId !== null && watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  async getRoute(start, end) {
    // Open Source Routing Machine (OSRM) - 100% Free Public Driving API (No Token Required)
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`OSRM Routing failed: ${res.status}`);
      }

      const data = await res.json();
      if (!data.routes?.length) {
        return null;
      }

      return {
        type: "Feature",
        properties: {
          distance: data.routes[0].distance,
          duration: data.routes[0].duration,
        },
        geometry: data.routes[0].geometry,
      };
    } catch (err) {
      console.warn("OSRM routing unavailable, falling back to direct line:", err);
      return {
        type: "Feature",
        properties: { distance: 0, duration: 0 },
        geometry: {
          type: "LineString",
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
        },
      };
    }
  }

  fitMapToPoints(mapInstance, start, end) {
    if (!mapInstance || !start || !end) return;
    mapInstance.fitBounds([
      [start.lat, start.lng],
      [end.lat, end.lng],
    ], { padding: [50, 50] });
  }

  focusCurrentLocation(mapInstance, currentPosition) {
    if (!mapInstance || !currentPosition) return;
    mapInstance.setView([currentPosition.lat, currentPosition.lng], 16);
  }
}
