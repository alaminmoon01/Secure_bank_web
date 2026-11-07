const DEVICE_ID_KEY = "securebank_device_id";

export function getDeviceFingerprint() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    if (typeof crypto.randomUUID === "function") {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}`;
    }

    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}