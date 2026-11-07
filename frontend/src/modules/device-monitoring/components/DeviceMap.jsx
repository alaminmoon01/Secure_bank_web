

export default function DeviceMap({ location }) {
  if (
    !location ||
    location.permissionStatus !== "GRANTED" ||
    location.latitude == null ||
    location.longitude == null
  ) {
    return <p>GPS location is not available.</p>;
  }

  const mapUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`;

  return (
    <div className="device-map">
      <h3>Device GPS Location</h3>

      <p>
        Latitude: {location.latitude}
      </p>

      <p>
        Longitude: {location.longitude}
      </p>

      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        View Location on OpenStreetMap
      </a>
    </div>
  );
}
