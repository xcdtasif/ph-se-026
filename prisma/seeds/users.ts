import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/utils/password";
import type { UserRole } from "../generated/prisma/enums";
import config from "../../src/config";

export async function seedUsers() {
  console.log("Seeding users...");

  const users = [
    {
      email: config.adminEmail,
      rawPassword: config.adminPassword,
      name: "Admin 01",
      role: "ADMIN" as UserRole,
    },
    {
      email: "landlord01@email.com",
      rawPassword: "1a2s3d4f",
      name: "Landlord 01",
      role: "LANDLORD" as UserRole,
    },
    {
      email: "tenant01@email.com",
      rawPassword: "1a2s3d4f",
      name: "Tenant 01",
      role: "TENANT" as UserRole,
    },
    {
      email: "tenant02@email.com",
      rawPassword: "1a2s3d4f",
      name: "Tenant 02",
      role: "TENANT" as UserRole,
    },
    {
      email: "tenant03@email.com",
      rawPassword: "1a2s3d4f",
      name: "Tenant 03",
      role: "TENANT" as UserRole,
    },
    {
      email: "tenant04@email.com",
      rawPassword: "1a2s3d4f",
      name: "Tenant 04",
      role: "TENANT" as UserRole,
    },
    {
      email: "tenant05@email.com",
      rawPassword: "1a2s3d4f",
      name: "Tenant 05",
      role: "TENANT" as UserRole,
    },
  ];

  const userMap = new Map<
    string,
    { id: string; email: string; name: string; role: UserRole }
  >();

  for (const u of users) {
    let user = await prisma.user.findUnique({
      where: { email: u.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: await hashPassword(u.rawPassword),
          name: u.name,
          role: u.role,
        },
      });
    }

    userMap.set(u.email, user);
  }

  console.log("Users seeded");
  return {
    admin01: userMap.get(config.adminEmail)!,
    landlord01: userMap.get("landlord01@email.com")!,
    tenant01: userMap.get("tenant01@email.com")!,
    tenant02: userMap.get("tenant02@email.com")!,
    tenant03: userMap.get("tenant03@email.com")!,
    tenant04: userMap.get("tenant04@email.com")!,
    tenant05: userMap.get("tenant05@email.com")!,
  };
}
