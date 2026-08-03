import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export const createReview = async (
  userId: string,
  data: {
    propertyId: string;
    requestId: string;
    rating: number;
    comment?: string;
  },
) => {
  // Verify request exists and belongs to user
  const request = await prisma.request.findUnique({
    where: { id: data.requestId },
    include: { property: true },
  });

  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, "Request not found");
  }

  if (request.tenantId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only review your own rentals",
    );
  }

  // Verify request is MOVED_OUT (completed rental)
  if (request.status !== "MOVED_OUT") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Can only review after rental is completed",
    );
  }

  // Verify property matches
  if (request.propertyId !== data.propertyId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Property does not match request",
    );
  }

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: { requestId: data.requestId },
  });

  if (existingReview) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Review already exists for this request",
    );
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      tenantId: userId,
      propertyId: data.propertyId,
      requestId: data.requestId,
      rating: data.rating,
      comment: data.comment ?? null,
    },
    include: {
      tenant: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true } },
    },
  });

  // Update property average rating
  await updatePropertyRating(data.propertyId);

  return review;
};

export const getPropertyReviews = async (
  propertyId: string,
  page = 1,
  limit = 10,
) => {
  const where = { propertyId };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tenant: { select: { id: true, name: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  // Calculate average rating
  const avgResult = await prisma.review.aggregate({
    where: { propertyId },
    _avg: { rating: true },
  });

  return {
    data: reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      averageRating: avgResult._avg.rating
        ? Number(avgResult._avg.rating.toFixed(1))
        : 0,
    },
  };
};

const updatePropertyRating = async (propertyId: string) => {
  const avgResult = await prisma.review.aggregate({
    where: { propertyId },
    _avg: { rating: true },
  });

  if (avgResult._avg.rating !== null) {
    await prisma.property.update({
      where: { id: propertyId },
      data: { averageRating: avgResult._avg.rating },
    });
  }
};
