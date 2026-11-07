
import crypto from "crypto";

import {
  findDeviceByFingerprint,
  createDevice,
  updateDevice,
  findCustomerDevices,
  findCustomerDevice,
  createDeviceSecurityLog,
} from "./device.repository.js";

import { getClientIp } from "./ip.service.js";
import { formatLocation } from "./location.service.js";

function hashFingerprint(fingerprint) {
  return crypto
    .createHash("sha256")
    .update(fingerprint)
    .digest("hex");
}

function detectBrowser(userAgent) {
  if (userAgent.includes("Edg/")) return "Microsoft Edge";
  if (userAgent.includes("Chrome/")) return "Google Chrome";
  if (userAgent.includes("Firefox/")) return "Mozilla Firefox";
  if (userAgent.includes("Safari/")) return "Safari";

  return "Unknown";
}

function detectOS(userAgent) {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone")) return "iOS";
  if (userAgent.includes("Mac OS")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";

  return "Unknown";
}

export async function registerDevice(customerId, body, req) {
  const fingerprintHash = hashFingerprint(body.deviceFingerprint);

  const existingDevice = await findDeviceByFingerprint(
    customerId,
    fingerprintHash
  );

  if (existingDevice) {
    return {
      device: existingDevice,
      alreadyRegistered: true,
    };
  }

  const userAgent = req.get("user-agent") || "Unknown";

  const device = await createDevice({
    customerId,
    fingerprintHash,
    deviceName: body.deviceName || "Unknown device",
    ipAddress: getClientIp(req),
    browser: detectBrowser(userAgent),
    operatingSystem: detectOS(userAgent),
    status: "PENDING",
    isActive: true,
  });

  return {
    device,
    alreadyRegistered: false,
  };
}

export async function getDevices(customerId) {
  return findCustomerDevices(customerId);
}

export async function updateDeviceLocation(customerId, location) {
  const device = await findCustomerDevice(
    customerId,
    location.deviceId
  );

  if (!device) {
    throw Object.assign(new Error("Device not found"), {
      status: 404,
    });
  }

  if (
    device.status !== "APPROVED" ||
    !device.isActive ||
    device.isLocked
  ) {
    throw Object.assign(
      new Error("Device is not approved or active"),
      { status: 403 }
    );
  }

  const updatedDevice = await updateDevice(device.id, {
    approximateLocation: formatLocation(location),
    lastUsedAt: new Date(),
  });

  await createDeviceSecurityLog({
    customerId,
    eventType: "DEVICE_LOCATION_UPDATED",
    severity: "INFO",
    description: "Customer device location was updated",
    metadata: {
      deviceId: device.id,
      accuracy: location.accuracy,
      source: "browser-geolocation",
    },
  });

  return updatedDevice;
}
