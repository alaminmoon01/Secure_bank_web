
export default function LocationStatus({ location, loading }) {
  if (loading) {
    return <p>Getting GPS location...</p>;
  }

  if (!location) {
    return <p>Location not requested.</p>;
  }

  return (
    <div className="location-status">
      <h3>GPS Location Status</h3>

      <p>
        <strong>Permission:</strong>{" "}
        {location.permissionStatus}
      </p>

      {location.permissionStatus === "GRANTED" ? (
        <>
          <p>
            <strong>Latitude:</strong> {location.latitude}
          </p>

          <p>
            <strong>Longitude:</strong> {location.longitude}
          </p>

          <p>
            <strong>Accuracy:</strong> {location.accuracy} meters
          </p>
        </>
      ) : (
        <p>GPS location was not provided.</p>
      )}
    </div>
  );
}
