import { PrismaClient } from "@prisma/client";
// Prisma v7 requires a driver adapter when using the 'client' engine type.
// Use the postgres adapter package installed in the project.
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is not set");
}

// Ensure Prisma reads the correct connection string from env at runtime
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = connectionString;
}

// Create a driver adapter instance for PrismaClient
const prismaAdapter = new PrismaPg(connectionString);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    adapter: prismaAdapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
