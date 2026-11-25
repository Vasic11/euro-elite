/**
 * Error text that is safe to store or return: short, and never a connection
 * string (a Postgres driver error can contain the full DATABASE_URL).
 */
export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]").slice(0, 500);
}
