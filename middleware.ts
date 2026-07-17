// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/explore(.*)",
  "/products(.*)",
  "/services(.*)",
  "/book(.*)",
  "/cart(.*)",
  "/bookings/success(.*)",
  "/api/user/sync(.*)",
  "/api/businesses/slug/(.*)",
  "/api/businesses/(.*)/items",
  "/api/businesses/items(.*)",
  "/api/bookings(.*)",
  "/api/bookings/reference/(.*)",
  "/api/webhooks/(.*)",
  "/api/items/(.*)",
  "/checkout(.*)",
  "/register-business(.*)",
  "/checkout/products(.*)",
  "/orders/success(.*)",
  "/api/orders/(.*)",
  "/banned",
]);

interface ClerkSessionMetadata {
  role?: string;
  isBanned?: boolean;
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";

  // A. Pass through static assets and API routes before auth check
  if (url.pathname.startsWith("/_next") || url.pathname.includes(".")) {
    return NextResponse.next();
  }

  // B. Trigger Clerk authentication guards if accessing a protected route
  const authSession = await auth();
  if (!isPublicRoute(req)) {
    if (!authSession.userId) {
      return authSession.redirectToSignIn({ returnBackUrl: req.url });
    }
  }

  // SECURITY PROTECTION STEP: Check ban state from the JWT — no DB call on Edge
  if (authSession.userId && url.pathname !== "/banned") {
    const metadata = authSession.sessionClaims?.metadata as
      | ClerkSessionMetadata
      | undefined;

    if (metadata?.isBanned) {
      url.pathname = "/banned";
      return NextResponse.redirect(url);
    }
  }

  // C. Guard loopback instance testing frameworks
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
  } else if (hostname.endsWith(".localhost:3000")) {
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
