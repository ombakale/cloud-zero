import React from "react";
import type { UserRole } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Login requirement removed completely; all views are directly accessible
  return <>{children}</>;
}
