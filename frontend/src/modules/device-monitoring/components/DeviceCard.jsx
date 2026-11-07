
import { useEffect, useRef, useState } from "react";

import useDeviceInfo from "../hooks/useDeviceInfo";
import useGeolocation from "../hooks/useGeolocation";

import { getIPInformation } from "../services/ipService";

import {
  registerDevice,
  getMyDevices,
  updateDeviceLocation,
} from "../services/deviceService";

import LocationStatus from "./LocationStatus";
import DeviceMap from "./DeviceMap";

import "../styles/DeviceMonitoring.css";

export default function DeviceCard() {
  const { deviceInfo, loading: deviceLoading } = useDeviceInfo();

  const {
    location,
    loading: gpsLoading,
    requestLocation,
  } = useGeolocation();

  const [ipInfo, setIpInfo] = useState(null);
  const [ipLoading, setIpLoading] = useState(false);

  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);

  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const registrationStarted = useRef(false);

  // Register the current device after collecting its information.
  useEffect(() => {
    if (deviceLoading || !deviceInfo || registrationStarted.current) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in as a customer to register this device.");
      return;
    }

    registrationStarted.current = true;

    async function registerCurrentDevice() {
      setRegistrationLoading(true);
      setError("");
      setMessage("");

      try {
        const deviceName = `${deviceInfo.deviceType} - ${deviceInfo.operatingSystem}`;

        const registration = await registerDevice(
          {
            deviceFingerprint: deviceInfo.fingerprint,
            deviceName,
          },
          token
        );

        const deviceList = await getMyDevices(token);

        setDevices(deviceList.devices || []);

        const registeredDevice =
          registration.device ||
          (deviceList.devices || []).find(
            (device) => device.deviceName === deviceName
          );

        setCurrentDevice(registeredDevice || null);

        setMessage(
          registration.alreadyRegistered
            ? "This device is already registered."
            : "Device registered. Waiting for admin approval."
        );
      } catch (err) {
        setError(err.message || "Device registration failed.");
      } finally {
        setRegistrationLoading(false);
      }
    }

    registerCurrentDevice();
  }, [deviceInfo, deviceLoading]);

  // Load IP information using the existing IP service.
  async function loadIPInformation() {
    setIpLoading(true);
    setError("");

    try {
      const result = await getIPInformation();
      setIpInfo(result);
    } catch (err) {
      setError(err.message || "Unable to retrieve IP information.");
    } finally {
      setIpLoading(false);
    }
  }

  // Request GPS permission and update the approved device.
  async function handleGPSLocation() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in first.");
      return;
    }

    if (!currentDevice) {
      setError("Device registration is not complete.");
      return;
    }

    if (
      currentDevice.status !== "APPROVED" ||
      !currentDevice.isActive ||
      currentDevice.isLocked
    ) {
      setError(
        "Your device must be approved, active and unlocked before GPS updates."
      );
      return;
    }

    setError("");
    setMessage("");

    const result = await requestLocation();

    if (result.permissionStatus !== "GRANTED") {
      setError(
        result.permissionStatus === "DENIED"
          ? "GPS permission was denied. Allow location access in your browser settings."
          : "Unable to access GPS location."
      );
      return;
    }

    setLocationSaving(true);

    try {
      await updateDeviceLocation(
        {
          deviceId: currentDevice.id,
          latitude: result.latitude,
          longitude: result.longitude,
          accuracy: result.accuracy,
        },
        token
      );

      setMessage("GPS location updated successfully.");

      const deviceList = await getMyDevices(token);
      setDevices(deviceList.devices || []);
    } catch (err) {
      setError(err.message || "GPS location update failed.");
    } finally {
      setLocationSaving(false);
    }
  }

  if (deviceLoading) {
    return <p>Collecting device information...</p>;
  }

  if (!deviceInfo) {
    return <p>Device information unavailable.</p>;
  }

  return (
    <section className="device-monitoring">

      <div className="device-card">
        <h3>Current Device Information</h3>

        <p>
          <strong>Device:</strong>{" "}
          {deviceInfo.deviceType} - {deviceInfo.operatingSystem}
        </p>

        <p>
          <strong>OS:</strong> {deviceInfo.operatingSystem}
        </p>

        <p>
          <strong>Browser:</strong> {deviceInfo.browser}
        </p>

        <p>
          <strong>Version:</strong> {deviceInfo.browserVersion}
        </p>

        <p>
          <strong>Resolution:</strong> {deviceInfo.screenResolution}
        </p>

        <p>
          <strong>Language:</strong> {deviceInfo.language}
        </p>

        <p>
          <strong>Timezone:</strong> {deviceInfo.timezone}
        </p>

        <p>
          <strong>Fingerprint:</strong>{" "}
          {deviceInfo.fingerprint}
        </p>

        <p>
          <strong>Registration:</strong>{" "}
          {registrationLoading
            ? "Registering..."
            : currentDevice?.status || "Not registered"}
        </p>
      </div>

      {message && (
        <p role="status" className="device-success">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="device-error">
          {error}
        </p>
      )}

      <div className="device-card">
        <h3>IP Information</h3>

        <button
          type="button"
          onClick={loadIPInformation}
          disabled={ipLoading}
        >
          {ipLoading ? "Loading..." : "Get IP Information"}
        </button>

        {ipInfo && (
          <>
            <p>IP: {ipInfo.ipAddress || "Unavailable"}</p>
            <p>Country: {ipInfo.country || "Unavailable"}</p>
            <p>Region: {ipInfo.region || "Unavailable"}</p>
            <p>City: {ipInfo.city || "Unavailable"}</p>
            <p>ISP: {ipInfo.isp || "Unavailable"}</p>
          </>
        )}
      </div>

      <div className="device-card">
        <h3>GPS Location</h3>

        <button
          type="button"
          onClick={handleGPSLocation}
          disabled={
            gpsLoading ||
            locationSaving ||
            registrationLoading ||
            !currentDevice ||
            currentDevice.status !== "APPROVED" ||
            !currentDevice.isActive ||
            currentDevice.isLocked
          }
        >
          {gpsLoading
            ? "Getting Location..."
            : locationSaving
              ? "Saving Location..."
              : "Share My GPS Location"}
        </button>

        <LocationStatus
          location={location}
          loading={gpsLoading || locationSaving}
        />

        <DeviceMap location={location} />
      </div>

      <div className="device-card">
        <h3>My Registered Devices</h3>

        {devices.length === 0 ? (
          <p>No registered devices found.</p>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="registered-device">
              <p>
                <strong>{device.deviceName || "Unknown device"}</strong>
              </p>

              <p>Browser: {device.browser || "Unknown"}</p>

              <p>Operating System: {device.operatingSystem || "Unknown"}</p>

              <p>Status: {device.status}</p>

              <p>
                Active: {device.isActive ? "Yes" : "No"}
              </p>

              <p>
                Locked: {device.isLocked ? "Yes" : "No"}
              </p>

              <p>
                Last Used:{" "}
                {device.lastUsedAt
                  ? new Date(device.lastUsedAt).toLocaleString()
                  : "Not available"}
              </p>
            </div>
          ))
        )}
      </div>

    </section>
  );
}
