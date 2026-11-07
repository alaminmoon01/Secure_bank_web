
import InfoPage from "./InfoPage";

export default function Reports() {
  return (
    <InfoPage
      title="Reports"
      description="View operational summaries for SecureBank."
      items={[
        "Customer growth summary",
        "Transaction activity summary",
        "Account balance summary",
        "Security event summary",
      ]}
    />
  );
}
