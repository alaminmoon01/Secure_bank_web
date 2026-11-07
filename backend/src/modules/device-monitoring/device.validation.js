const MAX_FINGERPRINT_LENGTH = 500;

export function validateDeviceRegistration(req, res, next) {
  const { deviceFingerprint, deviceName } = req.body;

  if (
    typeof deviceFingerprint !== "string" ||
    deviceFingerprint.length < 10 ||
    deviceFingerprint.length > MAX_FINGERPRINT_LENGTH
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid device fingerprint",
    });
  }

  if (
    deviceName !== undefined &&
    (typeof deviceName !== "string" || deviceName.length > 150)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid device name",
    });
  }

  next();
}

export function validateDeviceId(req, res, next) {
  const deviceId = Number(req.params.id);

  if (!Number.isSafeInteger(deviceId) || deviceId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid device ID",
    });
  }

  req.deviceId = deviceId;
  next();
}

export function validateLocationUpdate(req, res, next) {
  const { deviceId, latitude, longitude, accuracy } = req.body;

  const id = Number(deviceId);
  const lat = Number(latitude);
  const lng = Number(longitude);
  const gpsAccuracy = Number(accuracy);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid device ID is required",
    });
  }

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      message: "Invalid latitude",
    });
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      message: "Invalid longitude",
    });
  }

  if (
    !Number.isFinite(gpsAccuracy) ||
    gpsAccuracy < 0 ||
    gpsAccuracy > 100000
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid GPS accuracy",
    });
  }

  req.validatedLocation = {
    deviceId: id,
    latitude: lat,
    longitude: lng,
    accuracy: gpsAccuracy,
  };

  next();
}