import { prisma } from "../../src/lib/prisma";
import { seedUsers } from "./users";
import { seedCategories } from "./categories";
import { seedProperties } from "./properties";
import { seedRentalRequests } from "./rental-requests";
import { seedReviews } from "./reviews";

async function main() {
  console.log("Starting database seed...");

  // 1. Seed Users
  const {
    admin01,
    landlord01,
    tenant01,
    tenant02,
    tenant03,
    tenant04,
    tenant05,
  } = await seedUsers();

  // 2. Seed Categories
  const categoryMap = await seedCategories(admin01.id);

  // 3. Seed Properties
  const propertyMap = await seedProperties(categoryMap, landlord01.id);

  // 4. Seed Rental Requests
  const requestMap = await seedRentalRequests(propertyMap, {
    tenant01,
    tenant02,
    tenant03,
    tenant04,
    tenant05,
  });

  // 5. Seed Reviews
  await seedReviews(propertyMap, requestMap, {
    tenant01,
    tenant02,
    tenant03,
    tenant04,
    tenant05,
  });

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
