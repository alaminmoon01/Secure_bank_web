
import { prisma } from "../../../lib/prisma.js";

export function findDeviceByFingerprint(customerId, fingerprintHash) {
  return prisma.trustedDevice.findUnique({
    where: {
      customerId_fingerprintHash: {
        customerId,
        fingerprintHash,
      },
    },
  });
}

export function createDevice(data) {
  return prisma.trustedDevice.create({ data });
}

export function updateDevice(deviceId, data) {
  return prisma.trustedDevice.update({
    where: { id: deviceId },
    data,
  });
}

export function findCustomerDevices(customerId) {
  return prisma.trustedDevice.findMany({
    where: { customerId },
    select: {
      id: true,
      deviceName: true,
      ipAddress: true,
      browser: true,
      operatingSystem: true,
      approximateLocation: true,
      status: true,
      isActive: true,
      isLocked: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function findCustomerDevice(customerId, deviceId) {
  return prisma.trustedDevice.findFirst({
    where: {
      id: deviceId,
      customerId,
    },
  });
}

export function createDeviceSecurityLog(data) {
  return prisma.securityLog.create({
    data,
  });
}
