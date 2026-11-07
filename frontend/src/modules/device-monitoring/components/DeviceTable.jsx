export default function DeviceTable({ devices = [] }) {
  if (!devices.length) {
    return <p>No device records available.</p>;
  }

  return (
    <div className="device-table-wrapper">
      <h3>Registered Customer Devices</h3>

      <div style={{ overflowX: "auto" }}>
        <table className="device-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Device</th>
              <th>Operating System</th>
              <th>Browser</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Status</th>
              <th>Security</th>
              <th>Last Used</th>
            </tr>
          </thead>

          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>
                  <strong>
                    {device.customer?.fullName || "Unknown"}
                  </strong>
                  <br />
                  <small>Customer ID: {device.customerId}</small>
                </td>

                <td>
                  {device.customer?.email || "No email"}
                  <br />
                  <small>
                    {device.customer?.mobileNumber || "No mobile"}
                  </small>
                </td>

                <td>{device.deviceName || "Unknown"}</td>

                <td>{device.operatingSystem || "Unknown"}</td>

                <td>{device.browser || "Unknown"}</td>

                <td>{device.ipAddress || "Unavailable"}</td>

                <td>
                  {device.approximateLocation || "Not shared"}
                </td>

                <td>{device.status || "Unknown"}</td>

                <td>
                  {device.isLocked
                    ? "Locked"
                    : device.isActive
                      ? "Active"
                      : "Inactive"}
                </td>

                <td>
                  {device.lastUsedAt
                    ? new Date(device.lastUsedAt).toLocaleString()
                    : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}