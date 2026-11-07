
import InfoPage from "./InfoPage";

export default function AccountManagement() {
  return (
    <InfoPage
      title="Account Management"
      description="Review and manage customer account status."
      items={[
        "Search accounts by account number",
        "Inspect account status and account owner",
        "Review account details",
        "Block or unblock an account with an audit record",
      ]}
    />
  );
}
