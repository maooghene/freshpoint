"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  createAnnouncementAction,
  AnnouncementActionState,
} from "@/lib/actions/admin-announcements";

interface CreateAnnouncementFormProps {
  businesses: { id: string; name: string }[];
}

const initialState: AnnouncementActionState = { success: false, message: "" };

export function CreateAnnouncementForm({
  businesses,
}: CreateAnnouncementFormProps) {
  const [state, formAction, isPending] = useActionState(
    createAnnouncementAction,
    initialState,
  );
  const [targetType, setTargetType] = React.useState<
    "ALL" | "ROLE" | "BUSINESS"
  >("ALL");
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setTargetType("ALL");
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1.5 text-foreground">
          Title
        </label>
        <input
          name="title"
          type="text"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Scheduled maintenance tonight"
        />
        {state.errors?.title && (
          <p className="text-xs text-destructive mt-1">
            {state.errors.title[0]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-foreground">
          Message
        </label>
        <textarea
          name="message"
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Platform will be briefly unavailable between 1-2am WAT for scheduled upgrades."
        />
        {state.errors?.message && (
          <p className="text-xs text-destructive mt-1">
            {state.errors.message[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-foreground">
            Severity
          </label>
          <select
            name="severity"
            defaultValue="INFO"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="INFO">Info (banner)</option>
            <option value="WARNING">Warning (banner)</option>
            <option value="CRITICAL">Critical (modal)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-foreground">
            Ends At (optional)
          </label>
          <input
            name="endsAt"
            type="datetime-local"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-foreground">
          Audience
        </label>
        <select
          name="targetType"
          value={targetType}
          onChange={(e) =>
            setTargetType(e.target.value as "ALL" | "ROLE" | "BUSINESS")
          }
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="ALL">Everyone</option>
          <option value="ROLE">Specific role</option>
          <option value="BUSINESS">Specific business</option>
        </select>
      </div>

      {targetType === "ROLE" && (
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-foreground">
            Role
          </label>
          <select
            name="targetRole"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="CUSTOMER">Customer</option>
            <option value="BUSINESS_OWNER">Business Owner</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
          {state.errors?.targetRole && (
            <p className="text-xs text-destructive mt-1">
              {state.errors.targetRole[0]}
            </p>
          )}
        </div>
      )}

      {targetType === "BUSINESS" && (
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-foreground">
            Business
          </label>
          <select
            name="targetBusinessId"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {state.errors?.targetBusinessId && (
            <p className="text-xs text-destructive mt-1">
              {state.errors.targetBusinessId[0]}
            </p>
          )}
        </div>
      )}

      {state.message && (
        <p
          className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
      >
        {isPending ? "Publishing..." : "Publish Announcement"}
      </button>
    </form>
  );
}
