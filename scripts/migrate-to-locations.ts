import { prisma } from "../lib/prisma";

// One-time migration: gives every existing Business a primary Location,
// carried over from its current address/latitude/longitude/deliveryRadiusKm.
// Also migrates BusinessSchedule -> LocationSchedule, and assigns existing
// StaffProfile rows to the new primary Location.
//
// Safe to re-run: any Business that already has a primary Location is
// skipped entirely (idempotent), so running this twice is a no-op for
// businesses already migrated.
//
// Run with:
//   npx tsx --env-file=.env scripts/migrate-to-locations.ts
//
// Do NOT use a `dotenv` config() call inside this script — ESM import
// hoisting means lib/prisma.ts will throw on missing env vars before
// config() ever runs. Node's --env-file flag sidesteps this (same reason
// scripts/check-businesses.ts uses it).

async function main() {
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      deliveryRadiusKm: true,
      schedules: true, // BusinessSchedule[]
      staff: { select: { id: true, locationId: true } },
      locations: { select: { id: true, isPrimary: true } },
    },
  });

  console.log(`Found ${businesses.length} businesses to check.`);

  let migrated = 0;
  let skipped = 0;

  for (const business of businesses) {
    const alreadyHasPrimary = business.locations.some((l) => l.isPrimary);
    if (alreadyHasPrimary) {
      skipped++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const primaryLocation = await tx.location.create({
        data: {
          businessId: business.id,
          name: `${business.name} — Main Location`,
          address: business.address,
          latitude: business.latitude,
          longitude: business.longitude,
          deliveryRadiusKm: business.deliveryRadiusKm,
          isPrimary: true,
          isActive: true,
        },
      });

      // Migrate BusinessSchedule -> LocationSchedule, one row per day.
      if (business.schedules.length > 0) {
        await tx.locationSchedule.createMany({
          data: business.schedules.map((s) => ({
            locationId: primaryLocation.id,
            day: s.day,
            openTime: s.openTime,
            closeTime: s.closeTime,
            isClosed: s.isClosed,
          })),
        });
      }

      // Assign all existing staff (regardless of role) to the new primary
      // location. Starter/Growth businesses only ever have one location, so
      // this is correct and final for them. Pro businesses that later add a
      // second location can manually reassign specific staff off primary.
      const unassignedStaff = business.staff.filter((s) => !s.locationId);
      if (unassignedStaff.length > 0) {
        await tx.staffProfile.updateMany({
          where: { id: { in: unassignedStaff.map((s) => s.id) } },
          data: { locationId: primaryLocation.id },
        });
      }
    });

    migrated++;
    console.log(`Migrated: ${business.name} (${business.id})`);
  }

  console.log(
    `\nDone. Migrated: ${migrated}, already had primary location (skipped): ${skipped}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
