"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";

type UserRole = "customer" | "admin" | "support";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type UseAuthOptions = {
  allowedRoles?: UserRole[];
};

export function useAuth(
  options: UseAuthOptions = {},
) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const allowedRolesKey =
    options.allowedRoles?.join(",") || "";

  useEffect(() => {
    async function checkAuth() {
      const accessToken =
        localStorage.getItem("access_token");

      if (!accessToken) {
        router.replace("/");
        return;
      }

      try {
        const userData = await apiRequest<User>(
          "/users/me",
          {
            token: accessToken,
          },
        );

        const allowedRoles = allowedRolesKey
          ? allowedRolesKey.split(",")
          : [];

        if (
          allowedRoles.length > 0 &&
          !allowedRoles.includes(userData.role)
        ) {
          if (userData.role === "admin") {
            router.replace("/admin");
          } else if (userData.role === "support") {
            router.replace("/support");
          } else {
            router.replace("/dashboard");
          }

          return;
        }

        setToken(accessToken);
        setUser(userData);
      } catch {
        localStorage.removeItem("access_token");
        router.replace("/");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router, allowedRolesKey]);

  return {
    user,
    token,
    isLoading,
  };
}