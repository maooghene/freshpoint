export interface SchemaRatingItem {
  id: string;
  rating: number;
  review: string | null;
  userId: string;
  itemId: string;
  businessId: string;
  bookingId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function getBusinessAverageRating(
  businessId: string,
  allRatings: SchemaRatingItem[] = [],
): number {
  if (!businessId || !Array.isArray(allRatings) || allRatings.length === 0) {
    return 0;
  }

  const filtered = allRatings.filter((item) => item.businessId === businessId);
  if (filtered.length === 0) return 0;

  const sum = filtered.reduce((acc, current) => acc + current.rating, 0);
  const average = sum / filtered.length;

  return Math.round(average * 10) / 10;
}

export function getBusinessReviewCount(
  businessId: string,
  allRatings: SchemaRatingItem[] = [],
): number {
  if (!businessId || !Array.isArray(allRatings) || allRatings.length === 0) {
    return 0;
  }

  return allRatings.filter((item) => item.businessId === businessId).length;
}

export function getItemAverageRating(
  itemId: string,
  allRatings: SchemaRatingItem[] = [],
): number {
  if (!itemId || !Array.isArray(allRatings) || allRatings.length === 0) {
    return 0;
  }

  const filtered = allRatings.filter((item) => item.itemId === itemId);
  if (filtered.length === 0) return 0;

  const sum = filtered.reduce((acc, current) => acc + current.rating, 0);
  return Math.round((sum / filtered.length) * 10) / 10;
}
