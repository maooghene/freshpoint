import "dotenv/config";
import { PrismaClient, DayOfWeek } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting multi-tenant database seeding...");

  await prisma.booking.deleteMany();
  await prisma.item.deleteMany();
  await prisma.businessSchedule.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      clerkId: "user_admin_123",
      email: "admin@freshpoint.com",
      firstName: "Mao",
      lastName: "Og",
      role: "ADMIN",
      image: "https://unsplash.com",
    },
  });

  const owner = await prisma.user.create({
    data: {
      clerkId: "user_owner_456",
      email: "owner@haven.com",
      firstName: "Mayowa",
      lastName: "Developer",
      role: "BUSINESS_OWNER",
      image: "https://unsplash.com",
    },
  });

  const customer = await prisma.user.create({
    data: {
      clerkId: "user_customer_789",
      email: "customer@gmail.com",
      firstName: "Tunde",
      lastName: "Alabi",
      role: "CUSTOMER",
    },
  });

  const business = await prisma.business.create({
    data: {
      ownerId: owner.clerkId,
      name: "Haven Luxury Spa",
      slug: "haven-spa",
      email: "booking@havenspa.com",
      phone: "+2348012345678",
      address: "12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria",
      description:
        "A premium, peaceful urban sanctuary offering advanced wellness treatments, holistic massage sessions, and organic self-care cosmetics.",
      categories: ["SPA", "MASSAGE", "WELLNESS"],
      sittingCapacity: 4,
      status: "approved",
      isActive: true,
    },
  });

  const weekDays: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];

  await prisma.businessSchedule.createMany({
    data: weekDays.map((day) => ({
      businessId: business.id,
      day,
      openTime: "09:00",
      closeTime: "18:00",
      isClosed: false,
    })),
  });

  const serviceItem = await prisma.item.create({
    data: {
      businessId: business.id,
      type: "SERVICE",
      name: "Deep Tissue Massage Therapy",
      description:
        "A comprehensive 60-minute specialized full-body treatment designed to target chronic muscle tension and restore movement flexibility.",
      price: 25000,
      duration: 60,
      isActive: true,
    },
  });

  await prisma.item.create({
    data: {
      businessId: business.id,
      type: "PRODUCT",
      name: "Organic Hydrating Aloe Body Butter",
      description:
        "100% natural, intensely rich body cream manufactured locally with organic oils to lock in 24-hour hydration.",
      price: 12500,
      stock: 45,
      sku: "FP-HAVEN-ALOE-01",
      isActive: true,
    },
  });

  await prisma.booking.create({
    data: {
      userId: customer.id,
      businessId: business.id,
      itemId: serviceItem.id,
      startTime: new Date("2026-06-20T10:00:00Z"),
      endTime: new Date("2026-06-20T11:00:00Z"),
      status: "COMPLETED",
      locationType: "IN_SHOP",
      paymentReference: "PAYSTACK_MOCK_REF_999",
      paymentStatus: "paid",
      totalAmount: serviceItem.price,
    },
  });

  console.log("🚀 Seeding completed successfully! Tables populated cleanly.");
}

main()
  .catch((e) => {
    console.error("Critical Seeding Failure:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
