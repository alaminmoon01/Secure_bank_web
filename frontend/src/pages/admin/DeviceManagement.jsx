import { useCallback, useEffect, useState } from "react";
import DeviceTable from "../../modules/device-monitoring/components/DeviceTable";
import "../../modules/device-monitoring/styles/DeviceMonitoring.css";

const API_URL = "http://localhost:5000/api/admin";

export default function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const query =
        status === "ALL" ? "" : `?status=${encodeURIComponent(status)}`;

      const response = await fetch(`${API_URL}/devices${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load devices.");
      }

      setDevices(result.devices || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const pendingCount = devices.filter(
    (device) => device.status === "PENDING"
  ).length;

  const approvedCount = devices.filter(
    (device) => device.status === "APPROVED"
  ).length;

  const lockedCount = devices.filter(
    (device) => device.isLocked
  ).length;

  return (
    <div className="device-management-page">
      <h2>Device Management</h2>

      <p>
        Monitor registered customer devices and review their security status.
      </p>

      <div className="device-management-stats">
        <div className="device-card">
          <h3>Total Devices</h3>
          <h2>{devices.length}</h2>
        </div>

        <div className="device-card">
          <h3>Pending Devices</h3>
          <h2>{pendingCount}</h2>
        </div>

        <div className="device-card">
          <h3>Approved Devices</h3>
          <h2>{approvedCount}</h2>
        </div>

        <div className="device-card">
          <h3>Locked Devices</h3>
          <h2>{lockedCount}</h2>
        </div>
      </div>

      <div style={{ margin: "20px 0" }}>
        <label htmlFor="device-status">
          Filter by status:{" "}
        </label>

        <select
          id="device-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ALL">All Devices</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <button
          type="button"
          onClick={fetchDevices}
          disabled={loading}
          style={{ marginLeft: "12px" }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {loading && <p>Loading customer devices...</p>}

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <DeviceTable devices={devices} />
      )}
    </div>
  );
}