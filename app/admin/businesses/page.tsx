// app/admin/businesses/page.tsx
import { getAllPlatformVendors } from "@/lib/actions/admin-vendors";
import { VendorRow } from "@/components/admin/vendor-row";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const revalidate = 0;

export default async function AdminVendorsPage() {
  const vendors = await getAllPlatformVendors();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-border pb-6 min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Vendor Management Board
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Audit system onboarding parameters, track logistics rates, and
          override business operational statuses.
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">
            Registered Businesses
          </CardTitle>
          <CardDescription>
            Total active and pending registrations tracked on the platform (
            {vendors.length}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Business Info</TableHead>
                  <TableHead className="font-semibold">
                    Contact / Core Details
                  </TableHead>
                  <TableHead className="font-semibold">
                    Platform Status
                  </TableHead>
                  <TableHead className="font-semibold">
                    Delivery Parameters
                  </TableHead>
                  <TableHead className="font-semibold">
                    Onboarded Date
                  </TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center h-24 text-muted-foreground text-sm"
                    >
                      No business registrations found in database system
                      records.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((vendor) => (
                    <VendorRow key={vendor.id} vendor={vendor} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}