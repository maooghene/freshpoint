import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 instance import
import authOwner from "@/lib/authOwner"; // FIXED: Points to database-safe utility location
import { ItemType } from "@prisma/client"; // Safe type-safe enum directly from Prisma
import imagekit from "@/config/imageKit";

const uploadItemImage = async (imageFile: File): Promise<string> => {
  console.log(
    "📸 Uploading image:",
    imageFile.name,
    "size:",
    imageFile.size,
    "type:",
    imageFile.type,
  );

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const safeName = imageFile.name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  const uploadResponse = await imagekit.upload({
    file: buffer,
    fileName: `${Date.now()}-${safeName}`,
    folder: "/uploads",
  });

  console.log(
    "✅ ImageKit upload response:",
    uploadResponse.url,
    uploadResponse.filePath,
  );

  // ✅ Return the direct URL — no extra transformation wrapper needed
  return uploadResponse.url;
};

const resolveItemImageUrl = (rawImage: string | null): string | null => {
  if (!rawImage?.trim()) return null;
  const trimmed = rawImage.trim();
  const endpoint =
    process.env.IMAGEKIT_URL_ENDPOINT?.trim() ??
    "https://ik.imagekit.io/kpre23ygt";
  const sanitizedEndpoint = endpoint.replace(/\/+$/, "");

  try {
    const url = new URL(trimmed);
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

  if (/^\/uploads\//i.test(trimmed) || /^uploads\//i.test(trimmed)) {
    return null;
  }

  if (trimmed.startsWith("/")) return encodeURI(trimmed);
  return `${sanitizedEndpoint}/${encodeURI(trimmed.replace(/^\//, ""))}`;
};

// ✅ POST: Create a new inventory record (Service or Product) under a merchant business
export async function POST(request: NextRequest) {
  try {
    console.log("🔵 POST /api/businesses/items HIT");

    const { userId: clerkId } = getAuth(request);
    console.log("🔵 clerkId:", clerkId);

    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    console.log("🔵 businessId:", businessId);

    if (!businessId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    console.log("🔵 formData keys:", [...formData.keys()]);

    const typeInput = formData.get("type") as string;
    const type = typeInput === "PRODUCT" ? ItemType.PRODUCT : ItemType.SERVICE;
    const name = (formData.get("name") as string) || "";
    const description = (formData.get("description") as string) || "";
    const price = parseFloat((formData.get("price") as string) || "0");
    const imageFile = formData.get("image") as File | null;

    const duration =
      type === ItemType.SERVICE
        ? parseInt((formData.get("duration") as string) || "30", 10)
        : null;
    const stock =
      type === ItemType.PRODUCT
        ? parseInt((formData.get("stock") as string) || "0", 10)
        : null;

    if (!name || isNaN(price)) {
      return NextResponse.json(
        { error: "Missing required catalog fields" },
        { status: 400 },
      );
    }

    const newItem = await prisma.item.create({
      data: {
        businessId,
        type,
        name,
        description,
        price,
        duration,
        stock,
        image: imageFile ? await uploadItemImage(imageFile) : null,
        isActive: true,
      },
    });

    return NextResponse.json(
      { message: `${type} created successfully!`, item: newItem },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_ITEM_ROUTE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ✅ GET: Fetch all services and products owned by the active vendor profile
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.item.findMany({
      where: { businessId }, // FIXED: Pulls all rows bound explicitly to this tenant space
      orderBy: { createdAt: "desc" },
    });

    const normalizedItems = items.map((item) => ({
      ...item,
      image: resolveItemImageUrl(item.image),
    }));

    return NextResponse.json({ items: normalizedItems }, { status: 200 }); // Returns unified array payload cleanly
  } catch (error) {
    console.error("GET_ITEMS_ROUTE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ✅ PUT: Modify properties for an existing service or product row element safely
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();

    const id = formData.get("id") as string;
    const typeInput = formData.get("type") as string;
    const type = typeInput === "PRODUCT" ? ItemType.PRODUCT : ItemType.SERVICE;
    const name = (formData.get("name") as string) || "";
    const description = (formData.get("description") as string) || "";
    const price = parseFloat((formData.get("price") as string) || "0");
    const imageFile = formData.get("image") as File | null;

    const duration =
      type === ItemType.SERVICE
        ? parseInt((formData.get("duration") as string) || "30", 10)
        : null;
    const stock =
      type === ItemType.PRODUCT
        ? parseInt((formData.get("stock") as string) || "0", 10)
        : null;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required catalog identifier ID" },
        { status: 400 },
      );
    }

    // Security Boundary Check: Enforce structural multi-tenant isolation validation rules
    const existing = await prisma.item.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Requested inventory resource not found" },
        { status: 404 },
      );
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        type,
        name,
        description,
        price,
        duration,
        stock,
        image: imageFile ? await uploadItemImage(imageFile) : existing.image,
      },
    });

    return NextResponse.json(
      { message: "Updated successfully", item: updatedItem },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT_ITEM_ROUTE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ✅ DELETE: Wipe an offering completely out of database tables with secure tenant verification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { error: "Missing item identifier ID" },
        { status: 400 },
      );

    const { userId: clerkId } = getAuth(request);
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const item = await prisma.item.findFirst({
      where: { id, businessId }, // FIXED: Protects against cross-merchant deletion requests
    });

    if (!item) {
      return NextResponse.json(
        { error: "Inventory record not found or access denied" },
        { status: 404 },
      );
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE_ITEM_ROUTE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
