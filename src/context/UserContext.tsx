"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type UserRole = "resident" | "agency";

type ApiUserProfile = {
  email?: string | null;
  name?: string | null;
  role?: string | null;
  citizenProfile?: {
    fullName?: string | null;
  } | null;
  agencyProfile?: {
    agencyName?: string | null;
  } | null;
};

interface UserContextType {
  userRole: UserRole;
  userName: string;
  setUserRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  isUserLoading: boolean;
  login: (role: UserRole | string, name?: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function normalizeUserRole(role?: string | null): UserRole {
  const normalized = role?.toUpperCase();
  return normalized === "WARGA" || normalized === "RESIDENT"
    ? "resident"
    : "agency";
}

function getDisplayName(user: ApiUserProfile) {
  const profileName =
    user.citizenProfile?.fullName || user.agencyProfile?.agencyName;
  const accountName = user.name && !user.name.includes("@") ? user.name : "";

  return profileName || accountName || "User";
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>("resident");
  const [userName, setUserName] = useState<string>("User");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const login = useCallback((role: UserRole | string, name?: string) => {
    const nextRole = normalizeUserRole(role);
    setUserRole(nextRole);
    setIsAuthenticated(true);
    if (name && !name.includes("@")) {
      setUserName(name);
    } else {
      const defaultNames: Record<UserRole, string> = {
        resident: "Resident",
        agency: "Agency",
      };
      setUserName(defaultNames[nextRole]);
    }
  }, []);

  useEffect(() => {
    const hydrateUser = async () => {
      const token = localStorage.getItem("livon-token");
      if (!token) {
        setIsAuthenticated(false);
        setUserRole("resident");
        setUserName("User");
        setIsUserLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const json = await res.json();
        const user = (json.data?.data || json.data) as ApiUserProfile | null;

        if (!user) throw new Error("Profile not found");

        login(normalizeUserRole(user.role), getDisplayName(user));
      } catch {
        localStorage.removeItem("livon-token");
        setIsAuthenticated(false);
        setUserRole("resident");
        setUserName("User");
      } finally {
        setIsUserLoading(false);
      }
    };

    hydrateUser();
  }, [login]);

  const logout = () => {
    localStorage.removeItem("livon-token");
    setIsAuthenticated(false);
    setUserRole("resident");
    setUserName("User");
  };

  return (
    <UserContext.Provider
      value={{
        userRole,
        userName,
        setUserRole,
        isAuthenticated,
        isUserLoading,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
