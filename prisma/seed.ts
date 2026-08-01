import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/utils/password";
import config from "../src/config";

async function main() {
  console.log("Starting database seed...");

  // Create admin user from config
  const adminEmail = config.ADMIN_EMAIL;
  const adminPassword = config.ADMIN_PASSWORD;
  const adminName = config.ADMIN_NAME;

  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    // If the admin already exists, overwrite with the latest env file config
    update: {
      passwordHash: passwordHash,
      name: adminName,
      role: "ADMIN", // Enforces admin role even if it was modified
    },
    // If the admin does not exist, create it cleanly
    create: {
      email: adminEmail,
      passwordHash: passwordHash,
      name: adminName,
      role: "ADMIN",
    },
  });

  console.log("Admin user successfully synchronized");

  // Create default categories
  const categories = [
    {
      name: "Apartment",
      description: "Modern apartments in residential buildings",
    },
    { name: "House", description: "Standalone houses with private yards" },
    { name: "Studio", description: "Compact studio apartments for singles" },
    { name: "Condo", description: "Condominiums with shared amenities" },
    { name: "Townhouse", description: "Multi-level townhouses" },
    { name: "Villa", description: "Luxury villas with premium features" },
    {
      name: "Shared Room",
      description: "Budget-friendly shared accommodations",
    },
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
