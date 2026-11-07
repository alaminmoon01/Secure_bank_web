export async function getDeviceInfo() {
  const userAgent = navigator.userAgent;

  // Browser detection
  let browser = "Unknown";
  let browserVersion = "Unknown";

  if (userAgent.includes("Edg/")) {
    browser = "Microsoft Edge";
    browserVersion = userAgent.match(/Edg\/([\d.]+)/)?.[1] || "Unknown";
  } else if (userAgent.includes("Chrome/")) {
    browser = "Google Chrome";
    browserVersion = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || "Unknown";
  } else if (userAgent.includes("Firefox/")) {
    browser = "Mozilla Firefox";
    browserVersion = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || "Unknown";
  } else if (userAgent.includes("Safari/")) {
    browser = "Safari";
    browserVersion = userAgent.match(/Version\/([\d.]+)/)?.[1] || "Unknown";
  }

  // Operating system detection
  let operatingSystem = "Unknown";

  if (userAgent.includes("Windows")) {
    operatingSystem = "Windows";
  } else if (userAgent.includes("Mac OS")) {
    operatingSystem = "macOS";
  } else if (userAgent.includes("Linux")) {
    operatingSystem = "Linux";
  } else if (/Android/i.test(userAgent)) {
    operatingSystem = "Android";
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    operatingSystem = "iOS";
  }

  // Device type detection
  let deviceType = "Desktop";

  if (/Mobi/i.test(userAgent)) {
    deviceType = "Mobile";
  } else if (/Tablet|iPad/i.test(userAgent)) {
    deviceType = "Tablet";
  }

  return {
    browser,
    browserVersion,
    operatingSystem,
    deviceType,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent,
    collectedAt: new Date().toISOString(),
  };
}