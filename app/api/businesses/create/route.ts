import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";
import { parseValue, text, emailSchema, phoneSchema, validateImageFile, safeFileName } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // CORRECTED: Swapped legacy getAuth with async server session evaluator
import prisma from "@/lib/prisma";
import imagekit from "@/config/imageKit";
import { UserRole } from "@prisma/client";

// Helper function to generate clean url-safe slugs
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // strip special chars first, keep spaces/hyphens
    .trim()
    .replace(/\s+/g, "-") // collapse whitespace to single hyphens
    .replace(/-+/g, "-") // collapse any repeated hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

// ✅ POST: Process onboarding application forms and create a new business tenant space
import { getPlatformRules, MAINTENANCE_MESSAGE } from "@/lib/platform-rules";

export async function POST(request: NextRequest) {
  {
    const limited = await rateLimit(request, RATE_LIMITS.upload);
    if (limited) return limited;
  }
  console.log("POST /api/businesses/create initialized");

  try {
    const { userId: clerkId } = await auth(); // CORRECTED: Async session retrieval

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const platformRules = await getPlatformRules();
    if (platformRules.maintenanceModeActive || !platformRules.allowNewRegistrations) {
      return NextResponse.json(
        {
          error: platformRules.maintenanceModeActive
            ? MAINTENANCE_MESSAGE
            : "New business registrations are paused right now. Please check back soon.",
        },
        { status: 503 },
      );
    }

    // Resolve or build internal sequential database user context log mapping
    let dbUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId,
          firstName: "New",
          lastName: "User",
          email: "unknown@example.com",
          role: UserRole.CUSTOMER,
        },
      });
    }

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const sittingCapacity = formData.get("sittingCapacity") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const description = formData.get("description") as string | null;
    const image = formData.get("image") as File | null;

    const fieldsParse = parseValue(
      {
        name,
        email,
        sittingCapacity,
        phone,
        address,
        description: description ?? undefined,
      },
      z.object({
        name: text(120),
        email: emailSchema,
        sittingCapacity: z.string().trim().regex(/^\d{1,6}$/),
        phone: phoneSchema.refine((v) => v.length > 0, "Phone is required"),
        address: text(300),
        description: z.string().trim().max(2000).optional(),
      }),
    );
    if (!fieldsParse.ok) return fieldsParse.response;

    const imageError = validateImageFile(image, true);
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    // Strict parameter boundary assertions
    if (!name || !email || !sittingCapacity || !phone || !address || !image) {
      return NextResponse.json(
        {
          error:
            "All required configuration parameters fields must be supplied",
        },
        { status: 400 },
      );
    }

    // Checks for existing workspace linked securely to the relational user.id block to prevent tenant duplicates
    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: dbUser.id },
    });

    if (existingBusiness) {
      return NextResponse.json(
        {
          error:
            "A live business workspace profile is already registered under this account context.",
        },
        { status: 400 },
      );
    }

    // Generate unique URL slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Increments suffix numeric factors automatically if a collision matches existing system parameters
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Serialize file binary arrays safely into stream buffers for ImageKit upload processing
    const buffer = Buffer.from(await image.arrayBuffer());

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: `${Date.now()}-${safeFileName(image.name)}`,
      folder: "/businesses",
    });

    // CORRECTED: Altered width to numeric integer representation to prevent bad request 400 error codes
    const optimizedImageUrl = imagekit.url({
      path: uploadResponse.filePath,
      transformation: [{ quality: "auto" }, { format: "webp" }, { width: 512 }],
    });

    // Save multi-tenant workspace node directly to Prisma (Prisma v7 compliant)
    const newBusiness = await prisma.business.create({
      data: {
        ownerId: dbUser.id,
        name: name.trim(),
        slug,
        email: email.toLowerCase(),
        phone,
        address,
        description: description || null,
        image: optimizedImageUrl,
        sittingCapacity: parseInt(sittingCapacity, 10),
        isActive: false,
        status: "pending",
        staff: {
          create: {
            name: `${dbUser.firstName || "Store Manager"} (Owner)`,
            email: email.toLowerCase(),
            role: "Owner / Specialist",
            isActive: true,
            userId: dbUser.id,
          },
        },
      },
    });

    // Elevate account privileges directly to vendor platform parameters safely
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: UserRole.BUSINESS_OWNER },
    });

    return NextResponse.json(
      {
        message: "Wellness workspace onboarding data recorded successfully",
        business: newBusiness,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Critical Workspace Registration Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ✅ GET: Verify status context or resolve previously compiled workspace registration apps
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth(); // CORRECTED: Async session retrieval

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ isBusinessOwner: false }, { status: 404 });
    }

    // Pulls active company specs along with nested items relation array elements cleanly
    const businessInfo = await prisma.business.findFirst({
      where: { ownerId: dbUser.id },
      include: { items: true },
    });

    if (!businessInfo) {
      return NextResponse.json({ isBusinessOwner: false }, { status: 200 });
    }

    return NextResponse.json(
      {
        isBusinessOwner: true,
        businessInfo,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "GET Business Application Status Error Verification Check dropped:",
      error,
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
