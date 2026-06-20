import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 🔒 Define routes that require a user to log in before viewing
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Bypasses static files and assets, checks everything else
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))).*",
    "/(api|trpc)(.*)",
  ],
};
