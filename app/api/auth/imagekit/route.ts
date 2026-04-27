import crypto from "node:crypto";
import { NextResponse } from "next/server";

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function sanitizeEnv(value: string): string {
  return value
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
}

export async function GET() {
  const rawPublicKey = firstNonEmpty(
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    process.env.IMAGEKIT_PUBLIC_KEY,
  );
  const rawPrivateKey = firstNonEmpty(process.env.IMAGEKIT_PRIVATE_KEY);
  const rawUrlEndpoint = firstNonEmpty(
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    process.env.IMAGEKIT_URL_ENDPOINT,
  );
  const publicKey = sanitizeEnv(rawPublicKey);
  const privateKey = sanitizeEnv(rawPrivateKey);
  const urlEndpoint = sanitizeEnv(rawUrlEndpoint).replace(/\/+$/, "");

  const missing: string[] = [];
  if (!publicKey) {
    missing.push("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY or IMAGEKIT_PUBLIC_KEY");
  }
  if (!privateKey) {
    missing.push("IMAGEKIT_PRIVATE_KEY");
  }
  if (!urlEndpoint) {
    missing.push("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT or IMAGEKIT_URL_ENDPOINT");
  }

  const diagnostics = {
    publicKeyLength: publicKey.length,
    privateKeyLength: privateKey.length,
    urlEndpointLength: urlEndpoint.length,
    publicKeyPrefixOk: publicKey.startsWith("public_"),
    privateKeyPrefixOk: privateKey.startsWith("private_"),
    endpointLooksValid: /^https?:\/\/ik\.imagekit\.io\/.+/i.test(urlEndpoint),
  };

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "ImageKit is not configured",
        missing,
        diagnostics,
      },
      { status: 500 },
    );
  }

  try {
    const token = crypto.randomUUID().replace(/-/g, "");
    const expire = Math.floor(Date.now() / 1000) + 60 * 30;
    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey,
      urlEndpoint,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "ImageKit initialization failed",
        detail: message,
        diagnostics,
      },
      { status: 500 },
    );
  }
}