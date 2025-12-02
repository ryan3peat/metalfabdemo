import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

// Demo mode: Return mock admin user
const MOCK_ADMIN_USER: User = {
  id: "demo-admin-user",
  email: "admin@demo.com",
  firstName: "Demo",
  lastName: "Admin",
  role: "admin",
  active: true,
  companyName: null,
  profileImageUrl: null,
  passwordHash: null,
  passwordSetAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function useAuth() {
  // In demo mode, always return mock admin user
  return {
    user: MOCK_ADMIN_USER,
    isLoading: false,
    isAuthenticated: true,
    accessDenied: false,
    notRegisteredSupplier: false,
    errorMessage: undefined,
  };
}
