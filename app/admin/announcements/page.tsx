import { listAnnouncementsForAdmin } from "@/lib/actions/admin-announcements";
import { prisma } from "@/lib/prisma";
import { CreateAnnouncementForm } from "@/components/admin/announcements/CreateAnnouncementForm";
import { AnnouncementsTable } from "@/components/admin/announcements/AnnouncementsTable";

export default async function AdminAnnouncementsPage() {
  const [announcements, businesses] = await Promise.all([
    listAnnouncementsForAdmin(),
    prisma.business.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto text-foreground">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          System Announcements
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Broadcast policy updates, downtime alerts, and maintenance notices to
          targeted audiences.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold mb-4 text-foreground">
          New Announcement
        </h2>
        <CreateAnnouncementForm businesses={businesses} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold mb-4 text-foreground">
          Active & Past Announcements ({announcements.length})
        </h2>
        <AnnouncementsTable announcements={announcements} />
      </div>
    </div>
  );
}
