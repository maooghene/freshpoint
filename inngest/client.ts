import { Inngest } from "inngest";

export interface ClerkUserWebhookPayload {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
}

type FreshpointEvents = {
  "clerk/user.created": { data: ClerkUserWebhookPayload };
  "clerk/user.updated": { data: ClerkUserWebhookPayload };
  "clerk/user.deleted": { data: { id: string } };
};

// FIXED: Removed all template generic brackets <> from new Inngest.
// It relies on strict runtime inference from the option keys below.
export const inngest = new Inngest({
  id: "freshpoint-saas-platform",
  schemas: {} as FreshpointEvents, // ✅ Casts the schema record directly into options
});
