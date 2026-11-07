
import { getIPInformation } from "./ipService";
import { getCurrentGPSLocation } from "../hooks/useGeolocation";

export async function getLocationInformation() {
  const ipLocation = await getIPInformation();

  return {
    ipLocation,
    gpsLocation: {
      permissionStatus: "NOT_REQUESTED",
      latitude: null,
      longitude: null,
      accuracy: null,
    },
  };
}

export async function requestGPSLocation() {
  return await getCurrentGPSLocation();
}
