import ImageKit from "imagekit";
import { NextResponse } from "next/server";

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export async function GET() {
  const publicKey = firstNonEmpty(
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    process.env.IMAGEKIT_PUBLIC_KEY,
  );
  const privateKey = firstNonEmpty(process.env.IMAGEKIT_PRIVATE_KEY);
  const urlEndpoint = firstNonEmpty(
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    process.env.IMAGEKIT_URL_ENDPOINT,
  );

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

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "ImageKit is not configured",
        missing,
      },
      { status: 500 },
    );
  }

  try {
    const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
    return NextResponse.json(imagekit.getAuthenticationParameters());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "ImageKit initialization failed",
        detail: message,
      },
      { status: 500 },
    );
  }
}