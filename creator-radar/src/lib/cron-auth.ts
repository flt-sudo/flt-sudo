import { timingSafeEqual } from "node:crypto";

/** Constant-time check of `Authorization: Bearer <CRON_SECRET>`. Fails closed when unset. */
export function isAuthorizedCron(authorization: string | null, secret = process.env.CRON_SECRET): boolean {
  if (!secret || secret.length < 16 || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(authorization);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
