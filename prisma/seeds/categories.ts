import { prisma } from "../../src/lib/prisma";

export async function seedCategories() {
  console.log("Seeding categories...");

  const categoriesData = [
    { name: "Apartment", description: "Modern apartments in city centers" },
    { name: "House", description: "Standalone houses with yards" },
    { name: "Studio", description: "Compact studio units for singles" },
    { name: "Condo", description: "Condominiums with shared amenities" },
    { name: "Villa", description: "Luxury villas with private pools" },
    {
      name: "Townhouse",
      description: "Multi-floor townhomes with shared walls",
    },
    {
      name: "Loft",
      description: "Open-concept loft spaces with high ceilings",
    },
    {
      name: "Duplex",
      description: "Two-unit properties with separate entrances",
    },
    {
      name: "Penthouse",
      description: "Top-floor luxury units with premium views",
    },
    { name: "Cottage", description: "Cozy small homes in residential areas" },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    let category = await prisma.category.findFirst({
      where: { name: cat.name },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
        },
      });
    }

    categoryMap.set(cat.name, category.id);
  }

  console.log("Categories seeded");
  return categoryMap;
}
