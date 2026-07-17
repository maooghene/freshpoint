// lib/clerk-sync.ts
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Syncs a user's ban status into Clerk's publicMetadata so middleware
 * can check it from the JWT without hitting the database on the Edge runtime.
 */
export async function syncBanStatusToClerk(clerkId: string, isBanned: boolean) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkId);

  await client.users.updateUserMetadata(clerkId, {
    publicMetadata: {
      ...user.publicMetadata,
      isBanned,
    },
  });
}

/**
 * Immediately kills every active session for a user, forcing them out
 * right now rather than waiting for their JWT to naturally refresh.
 * Call this alongside syncBanStatusToClerk whenever banning someone.
 */
export async function revokeAllUserSessions(clerkId: string) {
  const client = await clerkClient();
  const { data: sessions } = await client.sessions.getSessionList({
    userId: clerkId,
  });

  await Promise.all(
    sessions.map((session) => client.sessions.revokeSession(session.id)),
  );
}
