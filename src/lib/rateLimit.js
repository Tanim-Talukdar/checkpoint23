const requests = new Map();

export function checkRateLimit(
  request,
  maxRequests = 5,
  windowMs = 15 * 60 * 1000
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const now = Date.now();
  const record = requests.get(ip);

  if (!record || now - record.start >= windowMs) {
    requests.set(ip, { count: 1, start: now });
    return { allowed: true };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil(
      (windowMs - (now - record.start)) / 1000
    );

    return {
      allowed: false,
      response: Response.json(
        {
          success: false,
          message: "Too many requests. Try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      ),
    };
  }

  record.count++;
  return { allowed: true };
}