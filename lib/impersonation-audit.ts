import { getImpersonationContext } from "@/lib/actions/admin-impersonate";
import { logAdminAction } from "@/lib/actions/admin-audit";

interface ImpersonatedActionParams {
  /** The business the action was performed on. */
  businessId: string;
  /** The business owner's user id. */
  ownerId: string;
  /** The user id of whoever performed the action. */
  actorUserId: string;
  /** Audit action name, UPPER_SNAKE_CASE like the other admin audit entries. */
  action: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records an audit entry when an admin changes a business while impersonating
 * it. Does nothing when the real owner acts, or when there is no matching
 * impersonation session, so ordinary owner actions are never logged here.
 *
 * Never throws: a logging failure must not break the customer-facing action.
 */
export async function auditImpersonatedAction({
  businessId,
  ownerId,
  actorUserId,
  action,
  metadata,
}: ImpersonatedActionParams): Promise<void> {
  try {
    if (ownerId === actorUserId) return;

    const context = await getImpersonationContext();
    if (!context.isImpersonating || context.businessId !== businessId) return;

    await logAdminAction({
      action,
      targetType: "Vendor",
      targetId: businessId,
      targetLabel: context.businessName ?? undefined,
      metadata: {
        ...metadata,
        viaImpersonation: true,
        adminActorId: context.adminId,
      },
    });
  } catch (error) {
    console.error("IMPERSONATION_AUDIT_FAILURE:", error);
  }
}
