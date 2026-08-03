import { prisma } from "../../src/lib/prisma";
import type { RequestStatus } from "../generated/prisma/enums";
export async function seedRequests(
  propertyMap: Map<
    string,
    { id: string; title: string; monthlyRent: number; securityDeposit: number }
  >,
  tenants: {
    tenant01: { id: string };
    tenant02: { id: string };
    tenant03: { id: string };
    tenant04: { id: string };
    tenant05: { id: string };
  },
) {
  console.log("Seeding requests...");

  const requests = [
    {
      status: "MOVE_IN_APPROVED" as RequestStatus,
      propertyId: propertyMap.get("Luxury Apartment in Gulshan")!.id,
      tenantId: tenants.tenant01.id,
      moveInDate: new Date("2026-09-01"),
      monthlyRent: propertyMap.get("Luxury Apartment in Gulshan")!.monthlyRent,
      securityDeposit: propertyMap.get("Luxury Apartment in Gulshan")!
        .securityDeposit,
      moveInApprovedAt: new Date("2026-08-15"),
      message: "Interested in this property",
      propertyStatus: "UNAVAILABLE" as const,
    },
    {
      status: "MOVE_IN_REJECTED" as RequestStatus,
      propertyId: propertyMap.get("Cozy Studio in Banani")!.id,
      tenantId: tenants.tenant02.id,
      moveInDate: new Date("2026-10-01"),
      monthlyRent: propertyMap.get("Cozy Studio in Banani")!.monthlyRent,
      securityDeposit: propertyMap.get("Cozy Studio in Banani")!
        .securityDeposit,
      rejectedAt: new Date("2026-09-20"),
      rejectedReason: "Landlord chose another tenant",
      message: "Would love to rent this",
      propertyStatus: "AVAILABLE" as const,
    },
    {
      status: "MOVE_OUT_REQUESTED" as RequestStatus,
      propertyId: propertyMap.get("Modern House in Dhanmondi")!.id,
      tenantId: tenants.tenant03.id,
      moveInDate: new Date("2026-09-01"),
      monthlyRent: propertyMap.get("Modern House in Dhanmondi")!.monthlyRent,
      securityDeposit: propertyMap.get("Modern House in Dhanmondi")!
        .securityDeposit,
      moveInApprovedAt: new Date("2026-08-10"),
      moveOutDate: new Date("2026-12-01"),
      message: "Need to move for work",
      propertyStatus: "RENTED" as const,
    },
    {
      status: "MOVED_OUT" as RequestStatus,
      propertyId: propertyMap.get("Luxury Villa in Bashundhara")!.id,
      tenantId: tenants.tenant04.id,
      moveInDate: new Date("2026-07-01"),
      monthlyRent: propertyMap.get("Luxury Villa in Bashundhara")!.monthlyRent,
      securityDeposit: propertyMap.get("Luxury Villa in Bashundhara")!
        .securityDeposit,
      moveInApprovedAt: new Date("2026-06-20"),
      moveOutDate: new Date("2026-11-01"),
      moveOutApprovedAt: new Date("2026-10-15"),
      damageAmount: 5000,
      message: "Perfect for my family",
      propertyStatus: "AVAILABLE" as const,
    },
    {
      status: "MOVED_OUT" as RequestStatus,
      propertyId: propertyMap.get("Premium Condo in Uttara")!.id,
      tenantId: tenants.tenant05.id,
      moveInDate: new Date("2026-08-01"),
      monthlyRent: propertyMap.get("Premium Condo in Uttara")!.monthlyRent,
      securityDeposit: propertyMap.get("Premium Condo in Uttara")!
        .securityDeposit,
      moveInApprovedAt: new Date("2026-07-15"),
      moveOutDate: new Date("2026-11-15"),
      moveOutApprovedAt: new Date("2026-11-01"),
      damageAmount: 2000,
      message: "Great condo, moving for job relocation",
      propertyStatus: "AVAILABLE" as const,
    },
  ];

  const requestMap = new Map<
    string,
    { id: string; propertyId: string; tenantId: string }
  >();

  for (const req of requests) {
    let request = await prisma.request.findFirst({
      where: {
        propertyId: req.propertyId,
        tenantId: req.tenantId,
      },
    });

    const { propertyStatus, ...requestData } = req;

    if (!request) {
      request = await prisma.request.create({
        data: requestData,
      });
    }

    // Update property status based on request status
    await prisma.property.update({
      where: { id: req.propertyId },
      data: { status: propertyStatus },
    });

    const key = `${req.propertyId}-${req.tenantId}`;
    requestMap.set(key, {
      id: request.id,
      propertyId: req.propertyId,
      tenantId: req.tenantId,
    });
  }

  console.log("Requests seeded");
  return requestMap;
}
