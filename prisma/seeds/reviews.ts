import { prisma } from "../../src/lib/prisma";

// Helper for Reviews
export async function upsertReview(reviewData: {
  id: string;
  propertyId: string;
  tenantId: string;
  rentalRequestId: string;
  rating: number;
  comment: string;
}) {
  const review = await prisma.review.upsert({
    where: { id: reviewData.id },
    update: {},
    create: reviewData,
  });
  return review;
}

export async function seedReviews(
  propertyMap: Map<string, { id: string; title: string; price: number }>,
  requestMap: Map<string, { id: string; propertyId: string; tenantId: string }>,
  tenants: {
    tenant01: { id: string };
    tenant02: { id: string };
    tenant03: { id: string };
    tenant04: { id: string };
    tenant05: { id: string };
  },
) {
  console.log("Seeding reviews...");

  const reviews = [
    {
      id: "00000000-0000-0000-0000-000000100001",
      propertyId: propertyMap.get("Luxury Apartment in Gulshan")!.id,
      tenantId: tenants.tenant01.id,
      rentalRequestId: requestMap.get(
        `${propertyMap.get("Luxury Apartment in Gulshan")!.id}-${
          tenants.tenant01.id
        }`,
      )!.id,
      rating: 5,
      comment:
        "Amazing apartment! The location is perfect, and the landlord is very responsive. Highly recommended!",
    },
    {
      id: "00000000-0000-0000-0000-000000100002",
      propertyId: propertyMap.get("Cozy Studio in Banani")!.id,
      tenantId: tenants.tenant03.id,
      rentalRequestId: requestMap.get(
        `${propertyMap.get("Cozy Studio in Banani")!.id}-${
          tenants.tenant03.id
        }`,
      )!.id,
      rating: 5,
      comment:
        "Perfect for a single professional. Clean, well-maintained, and great value for money.",
    },
    {
      id: "00000000-0000-0000-0000-000000100003",
      propertyId: propertyMap.get("Modern House in Dhanmondi")!.id,
      tenantId: tenants.tenant02.id,
      rentalRequestId: requestMap.get(
        `${propertyMap.get("Modern House in Dhanmondi")!.id}-${
          tenants.tenant02.id
        }`,
      )!.id,
      rating: 4,
      comment:
        "Great house with a beautiful garden. Minor maintenance issues but overall very satisfied.",
    },
    {
      id: "00000000-0000-0000-0000-000000100004",
      propertyId: propertyMap.get("Luxury Villa in Bashundhara")!.id,
      tenantId: tenants.tenant05.id,
      rentalRequestId: requestMap.get(
        `${propertyMap.get("Luxury Villa in Bashundhara")!.id}-${
          tenants.tenant05.id
        }`,
      )!.id,
      rating: 5,
      comment:
        "Absolutely stunning villa! The private pool and garden are incredible. Worth every penny.",
    },
    {
      id: "00000000-0000-0000-0000-000000100005",
      propertyId: propertyMap.get("Premium Condo in Uttara")!.id,
      tenantId: tenants.tenant04.id,
      rentalRequestId: requestMap.get(
        `${propertyMap.get("Premium Condo in Uttara")!.id}-${
          tenants.tenant04.id
        }`,
      )!.id,
      rating: 3,
      comment:
        "Nice condo with good amenities, but parking can be an issue during peak hours.",
    },
  ];

  for (const review of reviews) {
    await upsertReview(review);
  }

  console.log("Reviews seeded");
}
