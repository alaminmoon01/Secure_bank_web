
const IP_API_URL = "https://ipwho.is/";

export async function getIPInformation() {
  try {
    const response = await fetch(IP_API_URL);

    if (!response.ok) {
      throw new Error("IP lookup failed");
    }

    const data = await response.json();

    if (data.success === false) {
      throw new Error(data.message || "IP lookup unavailable");
    }

    return {
      ipAddress: data.ip || null,
      country: data.country || null,
      countryCode: data.country_code || null,
      region: data.region || null,
      city: data.city || null,
      postalCode: data.postal || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      isp: data.connection?.isp || null,
      organization: data.connection?.org || null,
      source: "IP",
      collectedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("IP information error:", error);

    return {
      ipAddress: null,
      country: null,
      region: null,
      city: null,
      isp: null,
      source: "IP",
      error: "IP information unavailable",
    };
  }
}
