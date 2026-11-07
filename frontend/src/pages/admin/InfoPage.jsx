
import "./adminPages.css";

export default function InfoPage({
  title,
  description,
  items = [],
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <span className="status-tag pending">
          MODULE NOT CONNECTED
        </span>
      </div>

      <div className="admin-card">
        <p className="muted">
          This page is prepared in the dashboard navigation,
          but its backend workflow is not connected yet.
          No sample data is being presented as real data.
        </p>

        <h3>Planned Functions</h3>

        <ul className="muted">
          {items.map((item, index) => (
            <li key={index} style={{ margin: "9px 0" }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
