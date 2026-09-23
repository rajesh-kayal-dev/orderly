export default class NavigationService {
  watchCurrentPosition(onSuccess, onError, options) {
    throw new Error("watchCurrentPosition() not implemented");
  }

  clearWatch(watchId) {
    throw new Error("clearWatch() not implemented");
  }

  async getRoute(start, end) {
    throw new Error("getRoute() not implemented");
  }

  fitMapToPoints(mapInstance, start, end) {
    throw new Error("fitMapToPoints() not implemented");
  }

  focusCurrentLocation(mapInstance, currentPosition) {
    throw new Error("focusCurrentLocation() not implemented");
  }
}