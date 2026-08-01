import { prisma } from "../src/lib/prisma";
import config from "../src/config";
import {
  findOrCreateCategory,
  findOrCreateProperty,
  findOrCreateUser,
} from "./seed.helpers";

async function main() {
  console.log("Starting database seed...");

  // 1. Seed Users
  const admin01 = await findOrCreateUser({
    email: config.ADMIN_EMAIL,
    rawPassword: config.ADMIN_PASSWORD,
    name: "Admin 01",
    role: "ADMIN",
  });

  const landlord01 = await findOrCreateUser({
    email: "landlord01@email.com",
    name: "Landlord 01",
    role: "LANDLORD",
  });

  const tenant01 = await findOrCreateUser({
    email: "tenant01@email.com",
    name: "Tenant 01",
    role: "TENANT",
  });

  // 2. Seed Categories
  const categoriesData = [
    {
      name: "Apartment",
      description: "Modern apartments in residential buildings",
    },
    { name: "House", description: "Standalone houses with private yards" },
    { name: "Studio", description: "Compact studio apartments for singles" },
    { name: "Condo", description: "Condominiums with shared amenities" },
    { name: "Villa", description: "Luxury villas with premium features" },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const category = await findOrCreateCategory(cat, admin01.id);
    categoryMap.set(cat.name, category.id);
  }

  // 3. Seed Properties
  const properties = [
    {
      title: "Modern Apartment in Gulshan",
      description:
        "Spacious 2-bedroom apartment with modern amenities, balcony, and city view.",
      location: "Gulshan-1, Dhaka",
      mapLocation: "https://maps.google.com/?q=Gulshan+1+Dhaka",
      price: 45000,
      images: ["https://example.com/apt1.jpg", "https://example.com/apt2.jpg"],
      categoryId: categoryMap.get("Apartment")!,
      landlordId: landlord01.id,
      isAvailable: true,
    },
    {
      title: "Luxury Villa in Banani",
      description:
        "Exclusive 4-bedroom villa with private garden, swimming pool, and garage.",
      location: "Banani, Dhaka",
      mapLocation: "https://maps.google.com/?q=Banani+Dhaka",
      price: 180000,
      images: [
        "https://example.com/villa1.jpg",
        "https://example.com/villa2.jpg",
      ],
      categoryId: categoryMap.get("Villa")!,
      landlordId: landlord01.id,
      isAvailable: true,
    },
    {
      title: "Cozy Studio in Dhanmondi",
      description:
        "Compact studio perfect for students or young professionals.",
      location: "Dhanmondi-27, Dhaka",
      mapLocation: "https://maps.google.com/?q=Dhanmondi+27+Dhaka",
      price: 18000,
      images: ["https://example.com/studio1.jpg"],
      categoryId: categoryMap.get("Studio")!,
      landlordId: landlord01.id,
      isAvailable: true,
    },
    {
      title: "Family House in Uttara",
      description:
        "3-bedroom house with backyard, parking space, and modern kitchen.",
      location: "Uttara Sector-7, Dhaka",
      mapLocation: "https://maps.google.com/?q=Uttara+Sector+7+Dhaka",
      price: 55000,
      images: [
        "https://example.com/house1.jpg",
        "https://example.com/house2.jpg",
      ],
      categoryId: categoryMap.get("House")!,
      landlordId: landlord01.id,
      isAvailable: true,
    },
    {
      title: "Premium Condo in Bashundhara",
      description: "High-rise condo with gym, pool, and 24/7 security.",
      location: "Bashundhara R/A, Dhaka",
      mapLocation: "https://maps.google.com/?q=Bashundhara+Dhaka",
      price: 65000,
      images: ["https://example.com/condo1.jpg"],
      categoryId: categoryMap.get("Condo")!,
      landlordId: landlord01.id,
      isAvailable: true,
    },
  ];

  for (const prop of properties) {
    await findOrCreateProperty(prop);
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
