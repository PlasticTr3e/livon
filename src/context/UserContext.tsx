"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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

  // Rehydrate state from localStorage on component mount
  useEffect(() => {
    const initUser = () => {
      const storedRole = localStorage.getItem("livon-role") as UserRole | null;
      const storedName = localStorage.getItem("livon-name");
      const storedToken = localStorage.getItem("livon-token");

      if (storedToken && storedRole) {
        setUserRole(storedRole);
        setUserName(storedName || "Resident User");
        setIsAuthenticated(true);
      }
    };
    initUser();
  }, []);

  const login = (role: UserRole, name?: string) => {
    setUserRole(role);
    setIsAuthenticated(true);

    let finalName = name;
    if (!name) {
      const defaultNames: Record<UserRole, string> = {
        Resident: "Warga Perumahan",
        Manager: "Manager RT",
        Admin: "Administrator",
      };
      finalName = defaultNames[role];
    }

    if (finalName) setUserName(finalName);

    // Persist to localStorage
    localStorage.setItem("livon-role", role);
    if (finalName) localStorage.setItem("livon-name", finalName);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole("Resident");
    setUserName("Resident User");

    // Clear from localStorage
    localStorage.removeItem("livon-token");
    localStorage.removeItem("livon-role");
    localStorage.removeItem("livon-name");
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
