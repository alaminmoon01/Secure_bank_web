
const API_URL = "http://localhost:5000/api/device-monitoring";

async function apiRequest(endpoint, token, options = {}) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

export async function registerDevice(deviceData, token) {
  return apiRequest("/register", token, {
    method: "POST",
    body: JSON.stringify(deviceData),
  });
}

export async function getMyDevices(token) {
  return apiRequest("/devices", token);
}

export async function updateDeviceLocation(locationData, token) {
  return apiRequest("/location", token, {
    method: "POST",
    body: JSON.stringify(locationData),
  });
}

export async function getBackendIpInformation(token) {
  return apiRequest("/ip-info", token);
}
