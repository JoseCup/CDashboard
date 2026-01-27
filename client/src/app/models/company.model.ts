// src/app/models/company.model.ts

export interface CompanyListItem {
  id: number;
  name: string;
  website?: string;
  contactEmail?: string;
}

export interface CompanyDetail {
  id: number;
  name: string;
  website?: string;
  contactEmail?: string;
  address?: string;
  createdAt?: string;
}
