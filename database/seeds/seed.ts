// seed.ts

import "dotenv/config";
import { db } from "../drizzle";
import { districts, regions } from "../schema";

async function seed() {
  console.log("⛏️ Seeding...");

  // Step 1: Seed Regions
  const insertedRegions = await db
    .insert(regions)
    .values([
      { name: "Bari", created_at: new Date() },
      { name: "Nugaal", created_at: new Date() },
      { name: "Raas Casayr", created_at: new Date() },
      { name: "Karkaar", created_at: new Date() },
      { name: "Sanaag", created_at: new Date() },
      { name: "Haylaan", created_at: new Date() },
      { name: "Mudug", created_at: new Date() },
      { name: "Sool", created_at: new Date() },
      { name: "Cayn", created_at: new Date() },
    ])
    .onConflictDoNothing()
    .returning();

  const regionMap = new Map<string, string>();
  insertedRegions.forEach((region) => {
    regionMap.set(region.name, region.id);
  });

  // Step 2: Seed Districts
  await db.insert(districts).values([
    // Bari
    { name: "Boosaaso", region_id: regionMap.get("Bari")!, created_at: new Date() },
    { name: "Ufeyn", region_id: regionMap.get("Bari")!, created_at: new Date() },
    { name: "Carmo", region_id: regionMap.get("Bari")!, created_at: new Date() },
    { name: "Iskushuban", region_id: regionMap.get("Bari")!, created_at: new Date() },
    { name: "Xaafuun", region_id: regionMap.get("Bari")!, created_at: new Date() },
    { name: "Qandala", region_id: regionMap.get("Bari")!, created_at: new Date() },
    { name: "Balidhidin", region_id: regionMap.get("Bari")!, created_at: new Date() },

    // Nugaal
    { name: "Garoowe", region_id: regionMap.get("Nugaal")!, created_at: new Date() },
    { name: "Burtinle", region_id: regionMap.get("Nugaal")!, created_at: new Date() },
    { name: "Eyl", region_id: regionMap.get("Nugaal")!, created_at: new Date() },
    { name: "Dangorayo", region_id: regionMap.get("Nugaal")!, created_at: new Date() },
    { name: "Godobjiraan", region_id: regionMap.get("Nugaal")!, created_at: new Date() },

    // Raas Casayr
    { name: "Caluula", region_id: regionMap.get("Raas Casayr")!, created_at: new Date() },
    { name: "Baargaal", region_id: regionMap.get("Raas Casayr")!, created_at: new Date() },
    { name: "Bareeda", region_id: regionMap.get("Raas Casayr")!, created_at: new Date() },
    { name: "Murcanyo", region_id: regionMap.get("Raas Casayr")!, created_at: new Date() },
    { name: "Gumbax", region_id: regionMap.get("Raas Casayr")!, created_at: new Date() },
    { name: "Dhudhub", region_id: regionMap.get("Raas Casayr")!, created_at: new Date() },
    { name: "Shaxda", region_id: regionMap.get("Raas Casayr")!, created_at: new Date() },

    // Karkaar
    { name: "Qardho", region_id: regionMap.get("Karkaar")!, created_at: new Date() },
    { name: "B/Bayla", region_id: regionMap.get("Karkaar")!, created_at: new Date() },
    { name: "Waaciye", region_id: regionMap.get("Karkaar")!, created_at: new Date() },
    { name: "Rako", region_id: regionMap.get("Karkaar")!, created_at: new Date() },
    { name: "Xumbays", region_id: regionMap.get("Karkaar")!, created_at: new Date() },

    // Sanaag
    { name: "Ceerigaabo", region_id: regionMap.get("Sanaag")!, created_at: new Date() },
    { name: "Badhan", region_id: regionMap.get("Sanaag")!, created_at: new Date() },
    { name: "Laasqorey", region_id: regionMap.get("Sanaag")!, created_at: new Date() },
    { name: "Xingalool", region_id: regionMap.get("Sanaag")!, created_at: new Date() },
    { name: "Fiqi-fuliye", region_id: regionMap.get("Sanaag")!, created_at: new Date() },
    { name: "Yube", region_id: regionMap.get("Sanaag")!, created_at: new Date() },

    // Haylaan
    { name: "Dhahar", region_id: regionMap.get("Haylaan")!, created_at: new Date() },
    { name: "Buraan", region_id: regionMap.get("Haylaan")!, created_at: new Date() },
    { name: "Ceelaayo", region_id: regionMap.get("Haylaan")!, created_at: new Date() },

    // Mudug
    { name: "Gaalkacyo", region_id: regionMap.get("Mudug")!, created_at: new Date() },
    { name: "Galdogob", region_id: regionMap.get("Mudug")!, created_at: new Date() },
    { name: "Buursaalax", region_id: regionMap.get("Mudug")!, created_at: new Date() },
    { name: "Xarfo", region_id: regionMap.get("Mudug")!, created_at: new Date() },
    { name: "Towfiiq", region_id: regionMap.get("Mudug")!, created_at: new Date() },
    { name: "Jariiban", region_id: regionMap.get("Mudug")!, created_at: new Date() },
    { name: "Saaxo", region_id: regionMap.get("Mudug")!, created_at: new Date() },

    // Sool
    { name: "Laascaanood", region_id: regionMap.get("Sool")!, created_at: new Date() },
    { name: "Taleex", region_id: regionMap.get("Sool")!, created_at: new Date() },
    { name: "Boocame", region_id: regionMap.get("Sool")!, created_at: new Date() },
    { name: "Xudun", region_id: regionMap.get("Sool")!, created_at: new Date() },
    { name: "Kalabeyr", region_id: regionMap.get("Sool")!, created_at: new Date() },
    { name: "Dharkeengeeyo", region_id: regionMap.get("Sool")!, created_at: new Date() },

    // Cayn
    { name: "Buuhoodle", region_id: regionMap.get("Cayn")!, created_at: new Date() },
    { name: "Widhwidh", region_id: regionMap.get("Cayn")!, created_at: new Date() },
    { name: "Horufadhi", region_id: regionMap.get("Cayn")!, created_at: new Date() },
    { name: "Ceegaag", region_id: regionMap.get("Cayn")!, created_at: new Date() },
  ])
  .onConflictDoNothing();

  console.log("✅ Seed completed.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
});
