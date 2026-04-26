import config from "@/lib/config/config";
import ImageKit from "imagekit";
import { NextResponse } from "next/server";

const {
  env: {
    imagekit: { publicKey, privateKey, urlEndpoint },
  },
} = config;

export async function GET() {
  if (!publicKey || !privateKey || !urlEndpoint) {
    return NextResponse.json(
      { error: "ImageKit is not configured" },
      { status: 500 },
    );
  }

  const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
  return NextResponse.json(imagekit.getAuthenticationParameters());
}