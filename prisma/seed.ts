import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting database seed...");

  // Create default categories
  const categories = [
    { name: "Apartment", description: "Modern apartments in residential buildings" },
    { name: "House", description: "Standalone houses with private yards" },
    { name: "Studio", description: "Compact studio apartments for singles" },
    { name: "Condo", description: "Condominiums with shared amenities" },
    { name: "Townhouse", description: "Multi-level townhouses" },
    { name: "Villa", description: "Luxury villas with premium features" },
    { name: "Shared Room", description: "Budget-friendly shared accommodations" },
    { name: "Commercial", description: "Commercial spaces for business" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: cat.description,
      },
    });
    console.log("Category created:", cat.name);
  }

  console.log("Database seed completed!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });