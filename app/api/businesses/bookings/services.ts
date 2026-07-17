import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { prisma } from "@/lib/prisma";
import { BookingStatus, Booking, User, BookingItem } from "@prisma/client";

export interface BookingUpdatePayload {
  BookingId: string;
  status: BookingStatus;
}

// Concrete type definitions matching your exact relational query output structure
interface CustomItemMetadata {
  name: string;
  price: number;
}

interface CustomBookingItemRelation extends BookingItem {
  item: CustomItemMetadata | null;
}

interface CustomUserSubset {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  image: string | null;
}

interface RichBookingRecord extends Booking {
  user: CustomUserSubset | null;
  items?: CustomBookingItemRelation[];
}

interface FormattedBookingResponse {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  createdAt: string;
  queueCode: string;
  paymentStatus: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  item: {
    name: string;
    price: number;
    duration: null;
  };
}

interface ServiceSuccessResult {
  success: true;
  data: FormattedBookingResponse[];
}

interface ServiceErrorResult {
  success: false;
  status: number;
  error: string;
}

type ServiceResult = ServiceSuccessResult | ServiceErrorResult;

/**
 * Multi-Tenant Security Scope Verification
 */
export async function verifyUserAccess(
  businessId: string,
  clerkId: string,
): Promise<boolean> {
  const systemUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!systemUser) return false;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true },
  });

  if (!business) return false;

  return authorizeBusinessAccess({
    businessId,
    ownerId: business.ownerId,
    systemUserId: systemUser.id,
    allowStaff: true,
  });
}

/**
 * Live Ground Mutation Status Processor
 */
export async function processBookingStatusUpdate(
  bookingId: string,
  status: BookingStatus,
  clerkId: string,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { businessId: true, startTime: true, status: true },
  });

  if (!booking) {
    return {
      success: false,
      status: 404,
      error: "Booking parameters not found",
    };
  }

  const hasAccess = await verifyUserAccess(booking.businessId, clerkId);
  if (!hasAccess) {
    return {
      success: false,
      status: 403,
      error: "Forbidden: Operations lockout applied",
    };
  }

  if (status === "COMPLETED" && booking.status !== "CONFIRMED") {
    const today = new Date();
    const scheduledDate = new Date(booking.startTime);
    today.setHours(0, 0, 0, 0);
    scheduledDate.setHours(0, 0, 0, 0);

    if (today < scheduledDate) {
      const formattedDate = new Date(booking.startTime).toLocaleDateString(
        "en-NG",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
      );
      return {
        success: false,
        status: 422,
        message: `Cannot complete a pending future appointment early. Please mark it as 'Confirmed' first to verify the client was served today (${formattedDate}).`,
      };
    }
  }

  await prisma.booking.update({
    where: { id: bookingId, businessId: booking.businessId },
    data: { status },
  });

  return { success: true };
}

/**
 * High-Density Data Loader Chronologically Mapping Front-end UI Requirements
 */
export async function getFormattedBookings(
  slug: string,
  clerkId: string,
): Promise<ServiceResult> {
  const normalSlug = slug.toLowerCase().trim();

  const business = await prisma.business.findUnique({
    where: { slug: normalSlug },
    select: { id: true },
  });

  if (!business) {
    return {
      success: false,
      status: 404,
      error: `Business space not found for slug parameters: ${slug}`,
    };
  }

  const hasAccess = await verifyUserAccess(business.id, clerkId);
  if (!hasAccess) {
    return {
      success: false,
      status: 403,
      error: "Forbidden: Multi-tenant access violation blocked",
    };
  }

  let bookings: RichBookingRecord[] = [];

  try {
    // STRATEGY A: Standard execution with full relational maps
    const result = await prisma.booking.findMany({
      where: { businessId: business.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        address: true,
        items: { include: { item: { select: { name: true, price: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    bookings = result as RichBookingRecord[];
  } catch (relationError: unknown) {
    console.warn(
      "Prisma deep join execution exception. Activating Strategy B:",
      relationError,
    );

    // STRATEGY B: Drop advanced constraints to maintain runtime uptime metrics
    const fallbackResult = await prisma.booking.findMany({
      where: { businessId: business.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    bookings = fallbackResult as RichBookingRecord[];
  }

  const formatted: FormattedBookingResponse[] = bookings.map(
    (b: RichBookingRecord) => {
      const bookingItemsArray = b.items || [];
      const [firstRelationRecord] = bookingItemsArray;
      const coreItemMetadata = firstRelationRecord
        ? firstRelationRecord.item
        : null;

      return {
        id: b.id,
        startTime: b.startTime
          ? new Date(b.startTime).toISOString()
          : new Date().toISOString(),
        endTime: b.endTime
          ? new Date(b.endTime).toISOString()
          : new Date().toISOString(),
        status: b.status || "PENDING",
        notes: b.notes || "",
        createdAt: b.createdAt
          ? new Date(b.createdAt).toISOString()
          : new Date().toISOString(),
        queueCode: b.queueCode || "NO-CODE",
        paymentStatus: b.paymentStatus || "PENDING",
        user: {
          firstName: b.user?.firstName || "Client",
          lastName: b.user?.lastName || "Profile",
          email: b.user?.email || "N/A",
          phone: b.user?.phone || "N/A",
        },
        item: {
          name: coreItemMetadata?.name || "General Treatment",
          price: b.totalAmount || coreItemMetadata?.price || 0,
          duration: null,
        },
      };
    },
  );

  return { success: true, data: formatted };
}
