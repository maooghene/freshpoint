import { inngest, ClerkUserWebhookPayload } from "./client";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// 1️⃣ FUNCTION: Sync User Creation Hooks
export const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-creation",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event, step }) => {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      image_url,
    } = event.data as ClerkUserWebhookPayload;

    const email =
      email_addresses && email_addresses.length > 0
        ? email_addresses[0].email_address
        : null;

    if (!clerkId || !email) {
      return {
        success: false,
        message: "Missing required identifier elements.",
      };
    }

    const user = await step.run("upsert-user-in-db", async () => {
      return await prisma.user.upsert({
        where: { clerkId },
        update: {
          email,
          firstName: first_name ?? undefined,
          lastName: last_name ?? undefined,
          image: image_url ?? undefined,
        },
        create: {
          clerkId,
          email,
          firstName: first_name || "",
          lastName: last_name || "",
          image: image_url || "",
          role: UserRole.CUSTOMER,
        },
      });
    });

    return { success: true, userId: user.id };
  },
);

// 2️⃣ FUNCTION: Sync User Modification Hooks
export const syncUserUpdation = inngest.createFunction(
  {
    id: "sync-user-updation",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event, step }) => {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      image_url,
    } = event.data as ClerkUserWebhookPayload;

    const email =
      email_addresses && email_addresses.length > 0
        ? email_addresses[0].email_address
        : undefined;

    if (!clerkId) {
      return { success: false, message: "Clerk ID is missing." };
    }

    await step.run("update-user-in-db", async () => {
      await prisma.user.update({
        where: { clerkId },
        data: {
          email: email ?? undefined,
          firstName: first_name ?? undefined,
          lastName: last_name ?? undefined,
          image: image_url ?? undefined,
        },
      });
    });

    return { success: true };
  },
);

// 3️⃣ FUNCTION: Sync Account Deletion Hooks
export const syncUserDeletion = inngest.createFunction(
  {
    id: "sync-user-deletion",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event, step }) => {
    const { id: clerkId } = event.data as { id: string };

    if (!clerkId) {
      return { success: false, message: "Clerk ID is missing." };
    }

    await step.run("delete-user-from-db", async () => {
      await prisma.user.delete({
        where: { clerkId },
      });
    });

    return { success: true };
  },
);
