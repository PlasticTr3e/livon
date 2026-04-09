"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type UserRole = "Resident" | "Manager" | "Admin";

interface UserContextType {
  userRole: UserRole;
  userName: string;
  setUserRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  login: (role: UserRole, name?: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>("Resident");
  const [userName, setUserName] = useState<string>("Resident User");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (role: UserRole, name?: string) => {
    setUserRole(role);
    setIsAuthenticated(true);
    if (name) {
      setUserName(name);
    } else {
      const defaultNames: Record<UserRole, string> = {
        Resident: "Warga Perumahan",
        Manager: "Manager RT",
        Admin: "Administrator",
      };
      setUserName(defaultNames[role]);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole("Resident");
    setUserName("Resident User");
  };

  return (
    <UserContext.Provider
      value={{
        userRole,
        userName,
        setUserRole,
        isAuthenticated,
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
