
export function formatLocation(location) {
  return JSON.stringify({
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    capturedAt: new Date().toISOString(),
  });
}
