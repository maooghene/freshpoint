// app/admin/users/page.tsx
import { searchPlatformUsers } from "@/lib/actions/admin-users";
import { UserSearchTable } from "@/components/admin/user-search-table";

export const revalidate = 0;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await searchPlatformUsers(q ?? "");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-border pb-6 min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Customer Directory
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Search accounts by name or email, and manage access status.
        </p>
      </div>

      <UserSearchTable initialUsers={users} initialQuery={q ?? ""} />
    </div>
  );
}
