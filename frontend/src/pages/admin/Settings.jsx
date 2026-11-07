
import InfoPage from "./InfoPage";

export default function Settings() {
  return (
    <InfoPage
      title="Settings"
      description="Administrator preferences and security settings."
      items={[
        "Admin profile information",
        "Password and session security guidance",
        "Application configuration overview",
        "Security preferences",
      ]}
    />
  );
}
