/**
 * Environment configuration loader.
 *
 * Reads configuration from process.env (set by a dotenv loader at the
 * application entry point). Every consumed value is validated here so that
 * a misconfigured deployment fails fast with a clear error instead of
 * silently misbehaving later.
 */

const REQUIRED_KEYS = ["GEMINI_API_KEY"];

function loadEnv() {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill in the values."
    );
  }

  return {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    },
    database: {
      url: process.env.DATABASE_URL || null,
    },
    redis: {
      url: process.env.REDIS_URL || "redis://localhost:6379",
    },
  };
}

export { loadEnv };
