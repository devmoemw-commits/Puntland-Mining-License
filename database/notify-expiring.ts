/**
 * Expiry notifier: finds APPROVED licenses expiring within a window and
 *  (1) creates a durable in-app notification for each staff recipient (deduped), and
 *  (2) emails a digest to those recipients via Resend.
 *
 * Run manually or on a schedule (e.g. daily cron):  npm run notify:expiring
 * Requires DATABASE_URL and RESEND_API_KEY.
 */
import "dotenv/config";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "./drizzle";
import { licenses, notifications, users } from "./schema";

const WINDOW_DAYS = 30;
const RECIPIENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MINISTER",
  "GENERAL_DIRECTOR",
  "DIRECTOR",
];

async function main() {
  const now = new Date();
  const until = new Date(now.getTime() + WINDOW_DAYS * 24 * 3600 * 1000);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const expiring = await db
    .select({
      id: licenses.id,
      ref: licenses.license_ref_id,
      company: licenses.company_name,
      expire: licenses.expire_date,
    })
    .from(licenses)
    .where(
      and(
        eq(licenses.status, "APPROVED"),
        gte(licenses.expire_date, now),
        lte(licenses.expire_date, until),
      ),
    );

  if (expiring.length === 0) {
    console.log("No licenses expiring within", WINDOW_DAYS, "days.");
    return;
  }

  console.log(`${expiring.length} license(s) expiring within ${WINDOW_DAYS} days.`);

  const recipients = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.role, RECIPIENT_ROLES));

  // 1) Durable in-app notifications (deduped per license per user per month).
  for (const r of recipients) {
    for (const lic of expiring) {
      const daysLeft = Math.ceil(
        (new Date(lic.expire).getTime() - now.getTime()) / (1000 * 3600 * 24),
      );
      await db
        .insert(notifications)
        .values({
          userId: r.id,
          type: "license.expiring",
          title: `License ${lic.ref} expires in ${daysLeft} day(s)`,
          body: `${lic.company} — expires ${new Date(lic.expire).toLocaleDateString()}`,
          link: `/licenses/${lic.id}`,
          entityType: "license",
          entityId: lic.id,
          dedupeKey: `expiring:${lic.id}:${monthKey}:${r.id}`,
        })
        .onConflictDoNothing();
    }
  }
  console.log("In-app notifications written.");

  // 2) Email digest.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email digest.");
    return;
  }
  const resend = new Resend(apiKey);

  const rows = expiring
    .map((l) => {
      const daysLeft = Math.ceil(
        (new Date(l.expire).getTime() - now.getTime()) / (1000 * 3600 * 24),
      );
      return `<tr><td style="padding:4px 8px;border:1px solid #ddd">${l.ref}</td><td style="padding:4px 8px;border:1px solid #ddd">${l.company}</td><td style="padding:4px 8px;border:1px solid #ddd">${new Date(l.expire).toLocaleDateString()}</td><td style="padding:4px 8px;border:1px solid #ddd">${daysLeft}</td></tr>`;
    })
    .join("");

  const html = `
    <div style="font-family:sans-serif">
      <h2>Mining licences expiring soon</h2>
      <p>${expiring.length} licence(s) will expire within ${WINDOW_DAYS} days.</p>
      <table style="border-collapse:collapse">
        <thead><tr>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Ref</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Company</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Expiry</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Days left</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  let sent = 0;
  for (const r of recipients) {
    if (!r.email) continue;
    try {
      const { error } = await resend.emails.send({
        from: "Puntland Mining <noreply@plmininglicense.com>",
        to: r.email,
        subject: `${expiring.length} mining licence(s) expiring within ${WINDOW_DAYS} days`,
        html,
      });
      if (error) console.error(`Email to ${r.email} failed:`, error);
      else sent++;
    } catch (e) {
      console.error(`Email to ${r.email} threw:`, e);
    }
  }
  console.log(`Email digest sent to ${sent}/${recipients.length} recipient(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
