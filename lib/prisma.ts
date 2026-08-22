import { PrismaClient } from "@prisma/client";
// Prisma v7 requires a driver adapter when using the 'client' engine type.
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use transaction pooled or direct urls based on environment allocation flags
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is not set");
}

// Ensure Prisma reads the correct connection string from env at runtime
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = connectionString;
}

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // CORRECTED: Allocate a production serverless pool configuration to prevent Neon slot exhaustion spikes
  const pool = new Pool({
    connectionString,
    max: 10, // Keep concurrent connection spikes strictly controlled
    idleTimeoutMillis: 15000, // Drop idle backend sockets fast to free slots for new serverless nodes
    connectionTimeoutMillis: 5000, // Timeout fast instead of locking client threads for 27s
  });

  const prismaAdapter = new PrismaPg(pool);

  prismaInstance = new PrismaClient({
    log: ["error"],
    adapter: prismaAdapter,
  });
} else {
  // Local development hot-reload tracking cache layer
  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString });
    const prismaAdapter = new PrismaPg(pool);

    globalForPrisma.prisma = new PrismaClient({
      log: ["error", "warn"],
      adapter: prismaAdapter,
    });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;
export default prisma;
