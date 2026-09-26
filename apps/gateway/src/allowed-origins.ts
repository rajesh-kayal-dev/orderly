type OriginCallback = (err: Error | null, allow?: boolean) => void;

const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

export function createOriginVerifier(): (origin: string | undefined, callback: OriginCallback) => void {
  const allowed = (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return (origin, callback) => {
    // No Origin header means a non-browser client (health checks, service RPC) — nothing to enforce.
    if (!origin || allowed.includes(origin) || (allowed.length === 0 && DEV_ORIGINS.includes(origin))) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin "${origin}" blocked by CORS policy`));
  };
}
