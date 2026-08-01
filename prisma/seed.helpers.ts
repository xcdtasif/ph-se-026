import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/utils/password";
import type { UserRole } from "./generated/prisma/enums";

// Helper for Users
export async function findOrCreateUser(userData: {
  email: string;
  rawPassword?: string;
  name: string;
  role: UserRole;
}) {
  let user = await prisma.user.findFirst({
    where: { email: userData.email },
  });

  if (!user) {
    const passwordHash = await hashPassword(userData.rawPassword || "1a2s3d4f");

    user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        name: userData.name,
        role: userData.role,
      },
    });
    console.log(`${userData.name} user created`);
  } else {
    console.log(`${userData.name} user already exists, skipping...`);
  }

  return user;
}

// Helper for Categories
export async function findOrCreateCategory(
  categoryData: { name: string; description: string },
  adminId: string,
) {
  let category = await prisma.category.findFirst({
    where: { name: categoryData.name },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: categoryData.name,
        description: categoryData.description,
        createdById: adminId,
      },
    });
    console.log("Category created:", category.name);
  } else {
    console.log("Category already exists, skipping:", category.name);
  }

  return category;
}

// Helper for Properties
export async function findOrCreateProperty(propertyData: {
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
  const existingProp = await prisma.property.findFirst({
    where: { title: propertyData.title },
  });

  if (!existingProp) {
    const property = await prisma.property.create({
      data: propertyData,
    });
    console.log("Property created:", property.title);
    return property;
  }

  console.log("Property already exists, skipping:", propertyData.title);
  return existingProp;
}
