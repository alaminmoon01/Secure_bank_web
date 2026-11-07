
import { useEffect, useState } from "react";
import { getDeviceInfo } from "../utils/deviceInfo";
import { getDeviceFingerprint } from "../utils/fingerprint";

export default function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function collectDeviceInfo() {
      try {
        const info = await getDeviceInfo();
        const fingerprint = getDeviceFingerprint();

        setDeviceInfo({
          ...info,
          fingerprint,
        });
      } catch (error) {
        console.error("Device information error:", error);
      } finally {
        setLoading(false);
      }
    }

    collectDeviceInfo();
  }, []);

  return {
    deviceInfo,
    loading,
  };
}
