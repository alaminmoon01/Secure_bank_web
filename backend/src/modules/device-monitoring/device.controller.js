import {
  registerDevice,
  getDevices,
  updateDeviceLocation,
} from "./device.service.js";

import { getIpInformation } from "./ip.service.js";

export async function registerDeviceController(req, res, next) {
  try {
    const result = await registerDevice(
      req.user.id,
      req.body,
      req
    );

    return res.status(result.alreadyRegistered ? 200 : 201).json({
      success: true,
      message: result.alreadyRegistered
        ? "Device already registered"
        : "Device registered and awaiting approval",
      device: result.device,
      alreadyRegistered: result.alreadyRegistered,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDevicesController(req, res, next) {
  try {
    const devices = await getDevices(req.user.id);

    return res.json({
      success: true,
      count: devices.length,
      devices,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLocationController(req, res, next) {
  try {
    const device = await updateDeviceLocation(
      req.user.id,
      req.validatedLocation
    );

    return res.json({
      success: true,
      message: "Device location updated",
      deviceId: device.id,
      location: device.approximateLocation,
    });
  } catch (error) {
    next(error);
  }
}

export function getIpInfoController(req, res) {
  return res.json({
    success: true,
    ...getIpInformation(req),
  });
}