import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// 1. Declare wide-open public channels to bypass execution bounds safely
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/explore(.*)",
  "/products(.*)",
  "/services(.*)",
  "/api/user/sync(.*)",
  "/api/businesses/slug/(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // A. Trigger Clerk authentication guards if accessing a hidden node
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";

  // B. Pass through static build chunks, public assets, or core API endpoints cleanly
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // C. Guard loopback instance testing frameworks (Bypass local host rewrites)
  if (hostname === "localhost:3000") {
    return NextResponse.next();
  }

  // D. Multi-Tenant Subdomain Parsing Logic
  const rootDomain = "freshpoint.com";
  let tenantSlug = "";

  if (hostname.endsWith(`.${rootDomain}`)) {
    tenantSlug = hostname
      .replace(`.${rootDomain}`, "")
      .replace(`:${url.port}`, "");
  }
  // Local development subdomain testing fallback (e.g. spa.localhost:3000)
  else if (hostname.endsWith(".localhost:3000")) {
    tenantSlug = hostname.replace(".localhost:3000", "");
  }

  // E. Rewrite internal paths dynamically to map matching Prisma slug records
  if (tenantSlug && tenantSlug !== "www") {
    url.pathname = `/explore/${tenantSlug}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
