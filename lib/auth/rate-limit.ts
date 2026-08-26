/**
 * Best-effort in-memory rate limiter for admin login attempts.
 *
 * IMPORTANT: on serverless platforms (Vercel) each function instance has its own
 * memory, so this does NOT provide a hard guarantee across instances/regions.
 * It stops the trivial case (one browser hammering /admin/login) but for real
 * brute-force protection in production, put this behind a durable store
 * (e.g. Upstash Redis — a few KB, free tier is enough) or enable your platform's
 * bot/attack protection (e.g. Vercel Attack Challenge Mode). Flagged here rather
 * than silently claiming this is sufficient on its own.
 */

const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 8;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}
