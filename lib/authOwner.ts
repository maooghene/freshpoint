import prisma from "@/lib/prisma"; // Core default Prisma v7 instance import
import { UserRole } from "@prisma/client"; // Type-safe enum directly from your Prisma schema

/**
 * Checks if a user has business owner privileges based on their Clerk ID.
 * Returns the matching company/business ID if verified, otherwise returns false.
 *
 * @param clerkId - The unique authenticated user string from Clerk
 * @returns The unique business String ID or false if unauthorized
 */
const authOwner = async (clerkId: string): Promise<string | false> => {
  try {
    if (!clerkId) return false;

    // 1. Fetch user model matching the clerk ID tracking token parameters
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
      },
    });

    // 2. Enforce structural role validation boundaries
    if (!user) return false;

    // Protects against tenant access breaches by allowing only owners or platform admins through
    if (user.role !== UserRole.BUSINESS_OWNER && user.role !== UserRole.ADMIN) {
      return false;
    }

    // 3. Resolve the corporate business entity mapped explicitly to this owner's model row
    const business = await prisma.business.findFirst({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
      },
    });

    // 4. Return the specific isolation tenant index ID string safely
    if (business) {
      return business.id;
    }

    return false;
  } catch (error) {
    console.error("CRITICAL_AUTH_OWNER_HELPER_EXCEPTION:", error);
    return false;
  }
};

export default authOwner;
