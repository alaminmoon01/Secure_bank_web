
import InfoPage from "./InfoPage";

export default function SecurityReports() {
  return (
    <InfoPage
      title="Security Reports"
      description="Review suspicious activity and security logs."
      items={[
        "Review failed login attempts",
        "Inspect security event severity and timestamps",
        "Investigate suspicious account activity",
        "Review account security events",
      ]}
    />
  );
}
