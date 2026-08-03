import type { TPaginatedResponse } from "../../types";

export interface IPropertyFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  status?: "AVAILABLE" | "RENTED" | "UNAVAILABLE";
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface IPropertyWithRelations {
  id: string;
  landlordId: string;
  categoryId: string;
  title: string;
  description: string;
  location: string;
  mapLocation: string | null;
  monthlyRent: number;
  securityDeposit: number;
  images: string[];
  status: "AVAILABLE" | "RENTED" | "UNAVAILABLE";
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string };
  landlord: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
  };
}

export type TPropertyPaginatedResponse =
  TPaginatedResponse<IPropertyWithRelations>;
