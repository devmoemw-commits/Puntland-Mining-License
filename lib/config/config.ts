function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function toOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return normalizeBaseUrl(url);
  }
}

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function resolveApiEndpoint(): string {
  const configured = process.env.NEXT_PUBLIC_API_ENDPOINT;
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;

  if (configured?.trim()) {
    const normalized = toOrigin(configured);
    // Safety: never use localhost in production if a Vercel domain exists.
    if (process.env.NODE_ENV === "production" && isLocalhostUrl(normalized) && vercelUrl) {
      return normalizeBaseUrl(vercelUrl);
    }
    return normalized;
  }

  if (vercelUrl) {
    return normalizeBaseUrl(vercelUrl);
  }

  return "http://localhost:3000";
}

const config = {
    env: {
      apiEndpoint: resolveApiEndpoint(),
      nextAuthSecret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "",
      apiSecretKey: process.env.API_SECRET_KEY ?? "",
      imagekit: {
        publicKey:
          process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ??
          process.env.IMAGEKIT_PUBLIC_KEY ??
          "",
        urlEndpoint:
          process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ??
          process.env.IMAGEKIT_URL_ENDPOINT ??
          "",
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY ?? "",
      },
      databaseUrl: process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.NEON_DATABASE_URL ?? "",
    },
  };
  
  export default config;