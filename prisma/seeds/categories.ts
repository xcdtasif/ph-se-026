import { prisma } from "../../src/lib/prisma";

// Helper for Categories
export async function upsertCategory(categoryData: {
  id: string;
  name: string;
  description: string;
  createdById: string;
}) {
  const category = await prisma.category.upsert({
    where: { name: categoryData.name },
    update: { id: categoryData.id },
    create: {
      id: categoryData.id,
      name: categoryData.name,
      description: categoryData.description,
      createdById: categoryData.createdById,
    },
  });
  return category;
}

export async function seedCategories(adminId: string) {
  console.log("Seeding categories...");

  const categoriesData = [
    {
      id: "00000000-0000-0000-0000-000000000101",
      name: "Apartment",
      description: "Modern apartments in city centers",
    },
    {
      id: "00000000-0000-0000-0000-000000000102",
      name: "House",
      description: "Standalone houses with yards",
    },
    {
      id: "00000000-0000-0000-0000-000000000103",
      name: "Studio",
      description: "Compact studio units for singles",
    },
    {
      id: "00000000-0000-0000-0000-000000000104",
      name: "Condo",
      description: "Condominiums with shared amenities",
    },
    {
      id: "00000000-0000-0000-0000-000000000105",
      name: "Villa",
      description: "Luxury villas with private pools",
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const category = await upsertCategory({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      createdById: adminId,
    });
    categoryMap.set(cat.name, category.id);
  }

  console.log("Categories seeded");
  return categoryMap;
}
