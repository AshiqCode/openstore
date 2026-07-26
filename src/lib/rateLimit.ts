// SERVER ONLY — a small in-memory rate limiter for API routes.
//
// Honest about its limits: memory is per serverless instance, so on Vercel a
// determined attacker spread across instances gets more than `limit` requests.
// It still stops the cheap cases — a loop hammering one endpoint from one IP —
// which is what these routes actually need protecting from. For hard guarantees
// you'd put a WAF or Upstash/Redis counter in front.

type Stamps = number[];
const buckets = new Map<string, Stamps>();

// Keeps the map from growing without bound on a long-lived instance.
const MAX_KEYS = 5000;

export function clientKey(req: Request, bucket: string): string {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  return `${bucket}:${ip}`;
}

// Returns true when the request is allowed.
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (buckets.size > MAX_KEYS) buckets.clear();

  const recent = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function tooManyRequests() {
  return Response.json(
    { error: 'Too many requests — wait a moment and try again.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}
