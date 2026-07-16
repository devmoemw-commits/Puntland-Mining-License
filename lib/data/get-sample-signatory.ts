import { eq, inArray } from "drizzle-orm";

import { db } from "@/database/drizzle";
import { systemConfig, users } from "@/database/schema";
import { SYSTEM_CONFIG_KEYS } from "@/lib/system-config-keys";

export type SampleSignatoryConfig = {
  roleCode: string;
  title: string;
};

export type SampleSignatory = SampleSignatoryConfig & {
  /** Display name of the user currently holding the configured role. */
  name: string;
  /** That user's profile signature image, if uploaded. */
  signatureUrl: string | null;
};

/** Pre-configuration defaults matching the previously hardcoded letter block. */
export const SAMPLE_SIGNATORY_DEFAULTS: SampleSignatoryConfig & { name: string } = {
  roleCode: "GENERAL_DIRECTOR",
  name: "Eng. Ismail Mohamed Hassan",
  title: "Director General of the Ministry of Energy, Minerals & Water",
};

/** Raw configuration values (for the settings form). */
export async function getSampleSignatoryConfig(): Promise<SampleSignatoryConfig> {
  try {
    const rows = await db
      .select()
      .from(systemConfig)
      .where(
        inArray(systemConfig.configKey, [
          SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_ROLE,
          SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_TITLE,
        ]),
      );
    const map = Object.fromEntries(rows.map((r) => [r.configKey, r.value ?? ""]));
    return {
      roleCode:
        map[SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_ROLE] ||
        SAMPLE_SIGNATORY_DEFAULTS.roleCode,
      title:
        map[SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_TITLE] ||
        SAMPLE_SIGNATORY_DEFAULTS.title,
    };
  } catch {
    return {
      roleCode: SAMPLE_SIGNATORY_DEFAULTS.roleCode,
      title: SAMPLE_SIGNATORY_DEFAULTS.title,
    };
  }
}

/** Resolved signatory: the user holding the configured role, with their profile signature. */
export async function getSampleSignatory(): Promise<SampleSignatory> {
  const config = await getSampleSignatoryConfig();

  try {
    const [holder] = await db
      .select({ name: users.name, signatureUrl: users.signatureImageUrl })
      .from(users)
      .where(eq(users.role, config.roleCode))
      .limit(1);

    return {
      ...config,
      name: holder?.name?.trim() || SAMPLE_SIGNATORY_DEFAULTS.name,
      signatureUrl: holder?.signatureUrl ?? null,
    };
  } catch {
    return {
      ...config,
      name: SAMPLE_SIGNATORY_DEFAULTS.name,
      signatureUrl: null,
    };
  }
}
