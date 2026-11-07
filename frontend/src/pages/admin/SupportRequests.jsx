
import InfoPage from "./InfoPage";

export default function SupportRequests() {
  return (
    <InfoPage
      title="Support Requests"
      description="Review customer support requests."
      items={[
        "View pending support tickets",
        "Review customer request details",
        "Update support request status",
        "Record admin decisions",
      ]}
    />
  );
}
