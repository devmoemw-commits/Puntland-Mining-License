import { db } from "@/database/drizzle";
import { systemConfig } from "@/database/schema";
import { inArray } from "drizzle-orm";
import { SYSTEM_CONFIG_KEYS } from "@/lib/system-config-keys";

export type CertificateAssets = {
  ministerStampUrl: string | null;
};

/** System-level certificate asset (minister stamp). Personal signatures live on `users.signature_image_url`. */
export async function getCertificateAssets(): Promise<CertificateAssets> {
  const keys = [SYSTEM_CONFIG_KEYS.MINISTER_STAMP_URL] as const;

  try {
    const rows = await db
      .select()
      .from(systemConfig)
      .where(inArray(systemConfig.configKey, [...keys]));

    const map = Object.fromEntries(
      rows.map((r) => [r.configKey, r.value ?? ""]),
    ) as Record<string, string>;

    return {
      ministerStampUrl: map[SYSTEM_CONFIG_KEYS.MINISTER_STAMP_URL] || null,
    };
  } catch {
    return {
      ministerStampUrl: null,
    };
  }
}
