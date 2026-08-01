import { prisma } from "../../src/lib/prisma";

// Helper for Properties
export async function upsertProperty(propertyData: {
  id: string;
  title: string;
  description: string;
  location: string;
  mapLocation: string;
  price: number;
  images: string[];
  categoryId: string;
  landlordId: string;
  isAvailable: boolean;
}) {
  const property = await prisma.property.upsert({
    where: { id: propertyData.id },
    update: {},
    create: propertyData,
  });
  return property;
}

export async function seedProperties(
  categoryMap: Map<string, string>,
  landlordId: string,
) {
  console.log("Seeding properties...");

  const properties = [
    {
      id: "00000000-0000-0000-0000-000000001001",
      title: "Luxury Apartment in Gulshan",
      description:
        "Spacious 3-bedroom apartment with modern amenities, balcony, and dedicated parking. Walking distance to shopping malls and restaurants.",
      location: "Gulshan-1, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.7808,90.4182",
      price: 45000,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      ],
      categoryId: categoryMap.get("Apartment")!,
      landlordId,
      isAvailable: true,
    },
    {
      id: "00000000-0000-0000-0000-000000001002",
      title: "Modern House in Dhanmondi",
      description:
        "Beautiful 4-bedroom house with garden, garage, and modern interior. Close to schools and hospitals.",
      location: "Dhanmondi, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.7465,90.3763",
      price: 65000,
      images: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
        "https://images.unsplash.com/photo-1600596542815-374b6081c41c?w=800",
      ],
      categoryId: categoryMap.get("House")!,
      landlordId,
      isAvailable: true,
    },
    {
      id: "00000000-0000-0000-0000-000000001003",
      title: "Cozy Studio in Banani",
      description:
        "Compact studio perfect for young professionals. Fully furnished with high-speed internet and laundry.",
      location: "Banani, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.7925,90.4019",
      price: 22000,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      ],
      categoryId: categoryMap.get("Studio")!,
      landlordId,
      isAvailable: true,
    },
    {
      id: "00000000-0000-0000-0000-000000001004",
      title: "Premium Condo in Uttara",
      description:
        "2-bedroom condo with gym, pool, and 24/7 security. Great community atmosphere.",
      location: "Uttara Sector 7, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.8759,90.3795",
      price: 35000,
      images: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      ],
      categoryId: categoryMap.get("Condo")!,
      landlordId,
      isAvailable: true,
    },
    {
      id: "00000000-0000-0000-0000-000000001005",
      title: "Luxury Villa in Bashundhara",
      description:
        "Stunning 5-bedroom villa with private pool, garden, and smart home features. Ultimate luxury living.",
      location: "Bashundhara R/A, Dhaka",
      mapLocation: "https://maps.google.com/?q=23.8223,90.4232",
      price: 120000,
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      ],
      categoryId: categoryMap.get("Villa")!,
      landlordId,
      isAvailable: true,
    },
  ];

  const propertyMap = new Map<
    string,
    { id: string; title: string; price: number }
  >();

  for (const prop of properties) {
    const property = await upsertProperty(prop);
    propertyMap.set(prop.title, {
      id: property.id,
      title: property.title,
      price: prop.price,
    });
  }

  console.log("Properties seeded");
  return propertyMap;
}
