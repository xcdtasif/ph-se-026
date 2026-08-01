import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/utils/password";
import type { UserRole } from "../generated/prisma/enums";

// Helper for Users
export async function upsertUser(userData: {
  id: string;
  email: string;
  rawPassword?: string;
  name: string;
  role: UserRole;
}) {
  const user = await prisma.user.upsert({
    where: { email: userData.email },
    update: { id: userData.id },
    create: {
      id: userData.id,
      email: userData.email,
      passwordHash: await hashPassword(userData.rawPassword || "1a2s3d4f"),
      name: userData.name,
      role: userData.role,
    },
  });
  return user;
}

export async function seedUsers() {
  console.log("Seeding users...");

  const users = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      email: "admin01@email.com",
      password: "1a2s3d4f",
      name: "Admin 01",
      role: "ADMIN" as UserRole,
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      email: "landlord01@email.com",
      password: "1a2s3d4f",
      name: "Landlord 01",
      role: "LANDLORD" as UserRole,
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      email: "tenant01@email.com",
      password: "1a2s3d4f",
      name: "Tenant 01",
      role: "TENANT" as UserRole,
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      email: "tenant02@email.com",
      password: "1a2s3d4f",
      name: "Tenant 02",
      role: "TENANT" as UserRole,
    },
    {
      id: "00000000-0000-0000-0000-000000000005",
      email: "tenant03@email.com",
      password: "1a2s3d4f",
      name: "Tenant 03",
      role: "TENANT" as UserRole,
    },
    {
      id: "00000000-0000-0000-0000-000000000006",
      email: "tenant04@email.com",
      password: "1a2s3d4f",
      name: "Tenant 04",
      role: "TENANT" as UserRole,
    },
    {
      id: "00000000-0000-0000-0000-000000000007",
      email: "tenant05@email.com",
      password: "1a2s3d4f",
      name: "Tenant 05",
      role: "TENANT" as UserRole,
    },
  ];

  const userMap = new Map<
    string,
    { id: string; email: string; name: string; role: UserRole }
  >();

  for (const u of users) {
    const user = await upsertUser({
      id: u.id,
      email: u.email,
      rawPassword: u.password,
      name: u.name,
      role: u.role,
    });
    userMap.set(u.email, user);
  }

  console.log("Users seeded");
  return {
    admin01: userMap.get("admin01@email.com")!,
    landlord01: userMap.get("landlord01@email.com")!,
    tenant01: userMap.get("tenant01@email.com")!,
    tenant02: userMap.get("tenant02@email.com")!,
    tenant03: userMap.get("tenant03@email.com")!,
    tenant04: userMap.get("tenant04@email.com")!,
    tenant05: userMap.get("tenant05@email.com")!,
  };
}
