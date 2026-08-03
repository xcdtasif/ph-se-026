import { prisma } from "../../src/lib/prisma";

export async function seedReviews(
  propertyMap: Map<string, { id: string; title: string; monthlyRent: number }>,
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
      propertyId: propertyMap.get("Luxury Apartment in Gulshan")!.id,
      tenantId: tenants.tenant01.id,
      requestId: requestMap.get(
        `${propertyMap.get("Luxury Apartment in Gulshan")!.id}-${
          tenants.tenant01.id
        }`,
      )!.id,
      rating: 5,
      comment:
        "Amazing apartment! The location is perfect, and the landlord is very responsive. Highly recommended!",
    },
    {
      propertyId: propertyMap.get("Cozy Studio in Banani")!.id,
      tenantId: tenants.tenant02.id,
      requestId: requestMap.get(
        `${propertyMap.get("Cozy Studio in Banani")!.id}-${
          tenants.tenant02.id
        }`,
      )!.id,
      rating: 5,
      comment:
        "Perfect for a single professional. Clean, well-maintained, and great value for money.",
    },
    {
      propertyId: propertyMap.get("Modern House in Dhanmondi")!.id,
      tenantId: tenants.tenant03.id,
      requestId: requestMap.get(
        `${propertyMap.get("Modern House in Dhanmondi")!.id}-${
          tenants.tenant03.id
        }`,
      )!.id,
      rating: 4,
      comment:
        "Great house with a beautiful garden. Minor maintenance issues but overall very satisfied.",
    },
    {
      propertyId: propertyMap.get("Luxury Villa in Bashundhara")!.id,
      tenantId: tenants.tenant04.id,
      requestId: requestMap.get(
        `${propertyMap.get("Luxury Villa in Bashundhara")!.id}-${
          tenants.tenant04.id
        }`,
      )!.id,
      rating: 5,
      comment:
        "Absolutely stunning villa! The private pool and garden are incredible. Worth every penny.",
    },
    {
      propertyId: propertyMap.get("Premium Condo in Uttara")!.id,
      tenantId: tenants.tenant05.id,
      requestId: requestMap.get(
        `${propertyMap.get("Premium Condo in Uttara")!.id}-${
          tenants.tenant05.id
        }`,
      )!.id,
      rating: 3,
      comment:
        "Nice condo with good amenities, but parking can be an issue during peak hours.",
    },
  ];

  for (const review of reviews) {
    let existingReview = await prisma.review.findFirst({
      where: {
        propertyId: review.propertyId,
        tenantId: review.tenantId,
      },
    });

    if (!existingReview) {
      await prisma.review.create({
        data: review,
      });
    }
  }

  console.log("Reviews seeded");
}
