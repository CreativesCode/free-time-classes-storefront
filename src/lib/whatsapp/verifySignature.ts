import crypto from "node:crypto";

/**
 * Verify an OpenWA webhook HMAC signature against the RAW request body.
 *
 * OpenWA signs each payload as `sha256=<hex>` (header usually
 * `X-OpenWA-Signature`). Always verify against the raw body string, never a
 * re-serialized JSON. See guide §5.7.
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;

  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.startsWith("sha256=")
    ? signatureHeader
    : `sha256=${signatureHeader}`;

  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
