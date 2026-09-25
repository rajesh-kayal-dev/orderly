export default abstract class NavigationService {
  abstract watchCurrentPosition(
    onSuccess: (position: any) => void,
    onError?: (error: any) => void,
    options?: any
  ): number;

  abstract clearWatch(watchId: number): void;

  abstract getRoute(start: [number, number], end: [number, number]): Promise<any>;

  abstract fitMapToPoints(mapInstance: any, start: [number, number], end: [number, number]): void;

  abstract focusCurrentLocation(mapInstance: any, currentPosition: [number, number]): void;
}
