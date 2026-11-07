
export function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || null;
}

export function getIpInformation(req) {
  return {
    ipAddress: getClientIp(req),
    userAgent: req.get("user-agent") || "Unknown",
  };
}
