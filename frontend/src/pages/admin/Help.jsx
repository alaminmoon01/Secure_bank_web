
import InfoPage from "./InfoPage";

export default function Help() {
  return (
    <InfoPage
      title="Help & Support"
      description="SecureBank administration help and usage notes."
      items={[
        "Create a customer before customer registration",
        "Use simulated deposits and withdrawals only",
        "Never enter real customer or banking information",
        "Review security requests before taking action",
      ]}
    />
  );
}
