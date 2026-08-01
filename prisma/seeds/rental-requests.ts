import { prisma } from "../../src/lib/prisma";
import type { RentalStatus } from "../generated/prisma/enums";

// Helper for Rental Requests
export async function upsertRentalRequest(requestData: {
  id: string;
  propertyId: string;
  tenantId: string;
  moveInDate: Date;
  moveOutDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  status: RentalStatus;
}) {
  const request = await prisma.rentalRequest.upsert({
    where: { id: requestData.id },
    update: {},
    create: requestData,
  });
  return request;
}

export async function seedRentalRequests(
  propertyMap: Map<string, { id: string; title: string; price: number }>,
  tenants: {
    tenant01: { id: string };
    tenant02: { id: string };
    tenant03: { id: string };
    tenant04: { id: string };
    tenant05: { id: string };
  },
) {
  console.log("Seeding rental requests...");

  const rentalRequests = [
    {
      id: "00000000-0000-0000-0000-000000010001",
      propertyId: propertyMap.get("Luxury Apartment in Gulshan")!.id,
      tenantId: tenants.tenant01.id,
      moveInDate: new Date("2026-09-01"),
      moveOutDate: new Date("2027-02-28"),
      monthlyRent: propertyMap.get("Luxury Apartment in Gulshan")!.price,
      securityDeposit:
        propertyMap.get("Luxury Apartment in Gulshan")!.price * 2,
      status: "APPROVED" as RentalStatus,
    },
    {
      id: "00000000-0000-0000-0000-000000010002",
      propertyId: propertyMap.get("Modern House in Dhanmondi")!.id,
      tenantId: tenants.tenant02.id,
      moveInDate: new Date("2026-10-01"),
      moveOutDate: new Date("2027-03-31"),
      monthlyRent: propertyMap.get("Modern House in Dhanmondi")!.price,
      securityDeposit: propertyMap.get("Modern House in Dhanmondi")!.price * 2,
      status: "PENDING" as RentalStatus,
    },
    {
      id: "00000000-0000-0000-0000-000000010003",
      propertyId: propertyMap.get("Cozy Studio in Banani")!.id,
      tenantId: tenants.tenant03.id,
      moveInDate: new Date("2026-09-15"),
      moveOutDate: new Date("2027-03-15"),
      monthlyRent: propertyMap.get("Cozy Studio in Banani")!.price,
      securityDeposit: propertyMap.get("Cozy Studio in Banani")!.price * 2,
      status: "APPROVED" as RentalStatus,
    },
    {
      id: "00000000-0000-0000-0000-000000010004",
      propertyId: propertyMap.get("Premium Condo in Uttara")!.id,
      tenantId: tenants.tenant04.id,
      moveInDate: new Date("2026-11-01"),
      moveOutDate: new Date("2027-05-01"),
      monthlyRent: propertyMap.get("Premium Condo in Uttara")!.price,
      securityDeposit: propertyMap.get("Premium Condo in Uttara")!.price * 2,
      status: "REJECTED" as RentalStatus,
    },
    {
      id: "00000000-0000-0000-0000-000000010005",
      propertyId: propertyMap.get("Luxury Villa in Bashundhara")!.id,
      tenantId: tenants.tenant05.id,
      moveInDate: new Date("2026-12-01"),
      moveOutDate: new Date("2027-11-30"),
      monthlyRent: propertyMap.get("Luxury Villa in Bashundhara")!.price,
      securityDeposit:
        propertyMap.get("Luxury Villa in Bashundhara")!.price * 2,
      status: "PENDING" as RentalStatus,
    },
  ];

  const requestMap = new Map<
    string,
    { id: string; propertyId: string; tenantId: string }
  >();

  for (const req of rentalRequests) {
    const request = await upsertRentalRequest(req);
    const key = `${req.propertyId}-${req.tenantId}`;
    requestMap.set(key, {
      id: request.id,
      propertyId: req.propertyId,
      tenantId: req.tenantId,
    });
  }

  console.log("Rental requests seeded");
  return requestMap;
}
