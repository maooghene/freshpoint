import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import imagekit from "@/config/imageKit";

// 💡 Blueprints matching your Prisma schema properties perfectly with 0% any
interface DatabaseItemPayload {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  image: string | null;
  duration: number | null;
  stock: number | null;
  businessId: string;
  isActive: boolean; // Added typesafe parameter tracking support
}

interface DatabaseSchedulePayload {
  id: string;
  day: string;
  isOff: boolean;
  staffProfileId: string;
}

interface DatabaseStaffPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  businessId: string;
  schedules?: DatabaseSchedulePayload[];
}

interface DatabaseBusinessPayload {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  address: string;
  email: string;
  phone: string;
  categories?: string[];
  isActive: boolean;
  items?: DatabaseItemPayload[];
  staff?: DatabaseStaffPayload[];
}

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> },
) {
  try {
    const params = await props.params;
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug parameter" },
        { status: 400 },
      );
    }

    // Locate the target workspace business, eagerly loading items catalog lines
    const business = await prisma.business.findUnique({
      where: { slug: decodeURIComponent(slug) },
      include: {
        // 💡 FIXED: Instantly screens out inactive items so they disappear on the customer end immediately!
        items: {
          where: {
            isActive: true,
          },
        },
        staff: {
          include: {
            schedules: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business workspace profile not found" },
        { status: 404 },
      );
    }

    // Cast explicitly to our standard payload contract to strip "any" keywords completely
    const typedBusiness = business as unknown as DatabaseBusinessPayload;

    const resolveAbsoluteImageUrl = (
      rawImage: string | null,
    ): string | null => {
      if (!rawImage?.trim()) return null;
      const trimmedImage = rawImage.trim();
      const rawEndpoint =
        process.env.IMAGEKIT_URL_ENDPOINT?.trim() ??
        "https://ik.imagekit.io/kpre23ygt";
      const sanitizedEndpoint = rawEndpoint.replace(/\/+$/, "");

      try {
        const url = new URL(trimmedImage);
        const endpointUrl = new URL(sanitizedEndpoint);
        if (url.hostname === endpointUrl.hostname) {
          const cleanedPath = url.pathname
            .replace(endpointUrl.pathname, "")
            .replace(/^\/+/, "");
          return imagekit.url({
            path: cleanedPath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "768" },
            ],
          });
        }
      } catch {
        // not a full URL; continue normal resolution
      }

      if (
        /^\/uploads\//i.test(trimmedImage) ||
        /^uploads\//i.test(trimmedImage)
      ) {
        return null;
      }

      if (trimmedImage.startsWith("/")) return encodeURI(trimmedImage);

      return `${sanitizedEndpoint}/${encodeURI(trimmedImage.replace(/^\//, ""))}`;
    };

    const formattedItems = (business.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      type: item.type, // "SERVICE" or "PRODUCT"
      image: resolveAbsoluteImageUrl(item.image),
      duration: item.duration,
      // Forces raw database integer reflection with zero math alterations
      stock:
        item.stock !== null && item.stock !== undefined
          ? Number(item.stock)
          : null,
      businessId: item.businessId,
    }));

    // 📊 Execute an atomic aggregate transaction against your precise Rating model fields
    const aggregationData = await prisma.rating.aggregate({
      where: {
        businessId: business.id, // Isolates reviews strictly to this current tenant shop
      },
      _count: {
        id: true, // Counts total number of registered rating rows
      },
      _avg: {
        rating: true, // Calculates mathematical average on your numeric "rating" Int column
      },
    });

    // Extract values safely, defaulting cleanly to zero states if no rows exist yet
    const totalReviewsCount = aggregationData._count.id;
    const averageRatingScore = aggregationData._avg.rating ?? 0.0;

    // Format score to 1 decimal place precisely (e.g., 4.7666 becomes "4.8")
    const functionalRatingString =
      totalReviewsCount > 0 ? averageRatingScore.toFixed(1) : "0.0";

    return NextResponse.json({
      id: business.id,
      name: business.name,
      slug: business.slug,
      status: business.status || "pending",
      description: business.description,
      image: business.image,
      address: business.address,
      email: business.email,
      phone: business.phone,
      categories: typedBusiness.categories || [],
      isActive: business.isActive !== false,

      // 🚀 DYNAMIC SENIOR REFACTOR: Pulls real metrics from your Rating model rows!
      rating: functionalRatingString,
      totalReviews: totalReviewsCount,

      items: formattedItems,
      staff: typedBusiness.staff || [],
    });
  } catch (error) {
    console.error("Critical public workspace slug API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
