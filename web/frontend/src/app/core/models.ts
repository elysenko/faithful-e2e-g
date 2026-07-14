// Roles match the backend Prisma enum (lowercase).
export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name?: string;
  email: string;
  role: Role;
  image?: string;
  createdAt?: string;
}

/** Raw auth payload returned by the NestJS backend (`{ user, token }`). */
export interface BackendAuthResponse {
  user: User;
  token: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

/** One row of the admin overview table: a user and their recipe count. */
export interface AdminOverviewRow {
  userId: string;
  email: string;
  recipeCount: number;
}

/** A configurable service/integration credential group shown on /admin/settings. */
export interface AdminSetting {
  key: string;
  value: string;
  configured: boolean;
  masked?: boolean;
}

export interface AdminServiceGroup {
  service: string;
  label: string;
  description: string;
  configured: boolean;
  settings: AdminSetting[];
}
