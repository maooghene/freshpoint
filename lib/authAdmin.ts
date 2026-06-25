import  prisma  from "@/lib/prisma";
import { UserRole } from "@prisma/client"; // Import the type-safe enum directly from Prisma

/**
 * Checks if a user has administrative privileges based on their Clerk ID.
 * Returns the internal database ID if they are an admin, otherwise returns false.
 */
const authAdmin = async (clerkId: string): Promise<string | false> => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
      },
    });

    // 1. Verify user profile exists in database logs
    if (!user) {
      return false;
    }

    // 2. Type-safe check against the explicit Prisma UserRole enum
    if (user.role === UserRole.ADMIN) {
      return user.id;
    }

    return false;
  } catch (error) {
    console.error("Critical AuthAdmin Helper Exception:", error);
    return false;
  }
};

export default authAdmin;
