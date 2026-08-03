import { prisma } from "../../src/lib/prisma";

export async function seedProperties(
  categoryMap: Map<string, string>,
  landlordId: string,
) {
  console.log("Seeding properties...");

  const properties = [
    {
      title: "Luxury Apartment in Gulshan",
      description:
        "Spacious 3-bedroom apartment with modern amenities, balcony, and dedicated parking. Walking distance to shopping malls and restaurants.",
      location: "Gulshan-1, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.7808,90.4182",
      monthlyRent: 45000,
      securityDeposit: 90000,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      ],
      categoryId: categoryMap.get("Apartment")!,
      landlordId,
      status: "AVAILABLE",
    },
    {
      title: "Modern House in Dhanmondi",
      description:
        "Beautiful 4-bedroom house with garden, garage, and modern interior. Close to schools and hospitals.",
      location: "Dhanmondi, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.7465,90.3763",
      monthlyRent: 65000,
      securityDeposit: 130000,
      images: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
        "https://images.unsplash.com/photo-1600596542815-374b6081c41c?w=800",
      ],
      categoryId: categoryMap.get("House")!,
      landlordId,
      status: "AVAILABLE",
    },
    {
      title: "Cozy Studio in Banani",
      description:
        "Compact studio perfect for young professionals. Fully furnished with high-speed internet and laundry.",
      location: "Banani, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.7925,90.4019",
      monthlyRent: 22000,
      securityDeposit: 44000,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      ],
      categoryId: categoryMap.get("Studio")!,
      landlordId,
      status: "AVAILABLE",
    },
    {
      title: "Premium Condo in Uttara",
      description:
        "2-bedroom condo with gym, pool, and 24/7 security. Great community atmosphere.",
      location: "Uttara Sector 7, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.8759,90.3795",
      monthlyRent: 35000,
      securityDeposit: 70000,
      images: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      ],
      categoryId: categoryMap.get("Condo")!,
      landlordId,
      status: "AVAILABLE",
    },
    {
      title: "Luxury Villa in Bashundhara",
      description:
        "Stunning 5-bedroom villa with private pool, garden, and smart home features. Ultimate luxury living.",
      location: "Bashundhara R/A, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.8223,90.4232",
      monthlyRent: 120000,
      securityDeposit: 240000,
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      ],
      categoryId: categoryMap.get("Villa")!,
      landlordId,
      status: "AVAILABLE",
    },
  ];

  const propertyMap = new Map<
    string,
    { id: string; title: string; monthlyRent: number; securityDeposit: number }
  >();

  for (const prop of properties) {
    let property = await prisma.property.findFirst({
      where: {
        title: prop.title,
        landlordId: landlordId,
      },
    });

    if (!property) {
      property = await prisma.property.create({
        data: {
          ...prop,
          status: prop.status as "AVAILABLE" | "RENTED" | "UNAVAILABLE",
        },
      });
    }

    propertyMap.set(prop.title, {
      id: property.id,
      title: property.title,
      monthlyRent: prop.monthlyRent,
      securityDeposit: prop.securityDeposit,
    });
  }

  console.log("Properties seeded");
  return propertyMap;
}
