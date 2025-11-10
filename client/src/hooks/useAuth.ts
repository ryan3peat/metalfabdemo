import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Extract error information
  const errorResponse = error as any;
  const accessDenied = errorResponse?.response?.status === 403;
  const notRegisteredSupplier = errorResponse?.response?.data?.code === "NOT_REGISTERED_SUPPLIER";
  const errorMessage = errorResponse?.response?.data?.message;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    accessDenied,
    notRegisteredSupplier,
    errorMessage,
  };
}
