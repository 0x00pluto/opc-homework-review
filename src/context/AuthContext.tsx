"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Role = "student" | "instructor" | null;

interface AuthContextType {
  role: Role;
  userId: string | null;
  loading: boolean;
  loginAsStudent: (userId: string) => void;
  loginAsInstructor: (instructorId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("opc_role") as Role;
    const storedUid = localStorage.getItem("opc_uid");
    if (storedRole) {
      setRole(storedRole);
      setUserId(storedUid);
    }
    setLoading(false);
  }, []);

  const loginAsStudent = (uid: string) => {
    setRole("student");
    setUserId(uid);
    localStorage.setItem("opc_role", "student");
    localStorage.setItem("opc_uid", uid);
  };

  const loginAsInstructor = (instructorId: string) => {
    setRole("instructor");
    setUserId(instructorId);
    localStorage.setItem("opc_role", "instructor");
    localStorage.setItem("opc_uid", instructorId);
  };

  const logout = () => {
    setRole(null);
    setUserId(null);
    localStorage.removeItem("opc_role");
    localStorage.removeItem("opc_uid");
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        userId,
        loading,
        loginAsStudent,
        loginAsInstructor,
        logout,
      }}
    >
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
