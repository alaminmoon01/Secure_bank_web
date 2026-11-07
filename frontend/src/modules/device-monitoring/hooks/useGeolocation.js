
import { useCallback, useState } from "react";

export default function useGeolocation() {
  const [location, setLocation] = useState({
    permissionStatus: "NOT_REQUESTED",
    latitude: null,
    longitude: null,
    accuracy: null,
  });

  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    setLoading(true);

    if (!navigator.geolocation) {
      const result = {
        permissionStatus: "UNSUPPORTED",
        latitude: null,
        longitude: null,
        accuracy: null,
      };

      setLocation(result);
      setLoading(false);

      return Promise.resolve(result);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = {
            permissionStatus: "GRANTED",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            collectedAt: new Date().toISOString(),
          };

          setLocation(result);
          setLoading(false);
          resolve(result);
        },

        (error) => {
          const result = {
            permissionStatus:
              error.code === error.PERMISSION_DENIED
                ? "DENIED"
                : "UNAVAILABLE",
            latitude: null,
            longitude: null,
            accuracy: null,
          };

          setLocation(result);
          setLoading(false);
          resolve(result);
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return {
    location,
    loading,
    requestLocation,
  };
}
