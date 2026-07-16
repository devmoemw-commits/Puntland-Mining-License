import { eq, inArray } from "drizzle-orm";

import { db } from "@/database/drizzle";
import { systemConfig, users } from "@/database/schema";
import { SYSTEM_CONFIG_KEYS } from "@/lib/system-config-keys";

export type SampleSignatoryConfig = {
  roleCode: string;
  /** Configured fallback name (used when the role holder is missing or has no profile name). */
  fallbackName: string;
  title: string;
};

export type SampleSignatory = Omit<SampleSignatoryConfig, "fallbackName"> & {
  /** Display name: role holder's profile name, else the configured fallback name. */
  name: string;
  /** That user's profile signature image, if uploaded. */
  signatureUrl: string | null;
};

/**
 * Last-resort defaults for a database that has not been seeded yet
 * (migration 0017 seeds the real values into `system_config`).
 */
export const SAMPLE_SIGNATORY_DEFAULTS: SampleSignatoryConfig = {
  roleCode: "GENERAL_DIRECTOR",
  fallbackName: "",
  title: "",
};

export type OrgContact = {
  tel: string;
  email: string;
  website: string;
};

/**
 * Last-resort defaults for a database that has not been seeded yet
 * (migration 0017 seeds the real values into `system_config`).
 */
export const ORG_CONTACT_DEFAULTS: OrgContact = {
  tel: "",
  email: "",
  website: "",
};

/** Organization contact info shown in document footers (configurable in settings). */
export async function getOrgContact(): Promise<OrgContact> {
  try {
    const rows = await db
      .select()
      .from(systemConfig)
      .where(
        inArray(systemConfig.configKey, [
          SYSTEM_CONFIG_KEYS.ORG_CONTACT_TEL,
          SYSTEM_CONFIG_KEYS.ORG_CONTACT_EMAIL,
          SYSTEM_CONFIG_KEYS.ORG_CONTACT_WEBSITE,
        ]),
      );
    const map = Object.fromEntries(rows.map((r) => [r.configKey, r.value ?? ""]));
    return {
      tel: map[SYSTEM_CONFIG_KEYS.ORG_CONTACT_TEL] || ORG_CONTACT_DEFAULTS.tel,
      email:
        map[SYSTEM_CONFIG_KEYS.ORG_CONTACT_EMAIL] || ORG_CONTACT_DEFAULTS.email,
      website:
        map[SYSTEM_CONFIG_KEYS.ORG_CONTACT_WEBSITE] ||
        ORG_CONTACT_DEFAULTS.website,
    };
  } catch {
    return { ...ORG_CONTACT_DEFAULTS };
  }
}

/** Raw configuration values (for the settings form). */
export async function getSampleSignatoryConfig(): Promise<SampleSignatoryConfig> {
  try {
    const rows = await db
      .select()
      .from(systemConfig)
      .where(
        inArray(systemConfig.configKey, [
          SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_ROLE,
          SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_NAME,
          SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_TITLE,
        ]),
      );
    const map = Object.fromEntries(rows.map((r) => [r.configKey, r.value ?? ""]));
    return {
      roleCode:
        map[SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_ROLE] ||
        SAMPLE_SIGNATORY_DEFAULTS.roleCode,
      fallbackName:
        map[SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_NAME] ||
        SAMPLE_SIGNATORY_DEFAULTS.fallbackName,
      title:
        map[SYSTEM_CONFIG_KEYS.SAMPLE_SIGNATORY_TITLE] ||
        SAMPLE_SIGNATORY_DEFAULTS.title,
    };
  } catch {
    return { ...SAMPLE_SIGNATORY_DEFAULTS };
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
      roleCode: config.roleCode,
      title: config.title,
      name: holder?.name?.trim() || config.fallbackName,
      signatureUrl: holder?.signatureUrl ?? null,
    };
  } catch {
    return {
      roleCode: config.roleCode,
      title: config.title,
      name: config.fallbackName,
      signatureUrl: null,
    };
  }
}
