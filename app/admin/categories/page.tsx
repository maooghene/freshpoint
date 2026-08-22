// app/admin/categories/page.tsx
import {
  getBusinessCategories,
  getItemCategories,
} from "@/lib/actions/admin-categories";
import { CategoriesManager } from "./CategoriesManager";

export default async function AdminCategoriesPage() {
  const [businessCategories, itemCategories] = await Promise.all([
    getBusinessCategories(),
    getItemCategories(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Categories
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage business types and item/service tags used across the platform.
        </p>
      </div>

      <CategoriesManager
        initialBusinessCategories={businessCategories}
        initialItemCategories={itemCategories}
      />
    </div>
  );
}
