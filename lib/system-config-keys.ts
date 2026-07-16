/** Keys stored in `system_config` (see `database/schema.ts`). */
export const SYSTEM_CONFIG_KEYS = {
  /** Official stamp image (ImageKit URL) — organization-wide. */
  MINISTER_STAMP_URL: "minister_stamp_url",
  /** Role whose holder signs sample analysis letters (name + signature shown on the letter). */
  SAMPLE_SIGNATORY_ROLE: "sample_signatory_role",
  /** Fallback signatory name when the role holder is missing or has no profile name. */
  SAMPLE_SIGNATORY_NAME: "sample_signatory_name",
  /** Title line printed under the sample signatory's name. */
  SAMPLE_SIGNATORY_TITLE: "sample_signatory_title",
  /** Organization contact info printed in document footers. */
  ORG_CONTACT_TEL: "org_contact_tel",
  ORG_CONTACT_EMAIL: "org_contact_email",
  ORG_CONTACT_WEBSITE: "org_contact_website",
} as const;
