import NavigationService from "./NavigationService";

export default class MapboxNavigationAdapter extends NavigationService {
  constructor(token) {
    super();
    this.token = token;
  }

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
    if (!this.token) {
      throw new Error("Missing MAPBOX token");
    }

    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${start.lng},${start.lat};${end.lng},${end.lat}` +
      `?geometries=geojson&overview=full&access_token=${this.token}`;

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Directions API failed: ${res.status} - ${text}`);
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
  }

  fitMapToPoints(mapInstance, start, end) {
    if (!mapInstance || !start || !end) return;

    const west = Math.min(start.lng, end.lng);
    const south = Math.min(start.lat, end.lat);
    const east = Math.max(start.lng, end.lng);
    const north = Math.max(start.lat, end.lat);

    mapInstance.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        duration: 1000,
        maxZoom: 16,
      }
    );
  }

  focusCurrentLocation(mapInstance, currentPosition) {
    if (!mapInstance || !currentPosition) return;

    mapInstance.flyTo({
      center: [currentPosition.lng, currentPosition.lat],
      zoom: 16,
      duration: 1000,
    });
  }
}