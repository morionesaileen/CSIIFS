import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface User {
  id: string | number; // String for Firebase UID, number for legacy Admin
  role: "Admin" | "Student";
  username?: string;
  student_number?: string;
  status: string;
  email?: string;
  avatar_id?: string;
  display_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Legacy Admin Check (JWT based)
    const storedToken = localStorage.getItem("admin_token");
    if (storedToken) {
      setToken(storedToken);
      fetch("/api/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user && data.user.role === "Admin") {
            setUser(data.user);
            setIsLoading(false);
          } else {
            localStorage.removeItem("admin_token");
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("admin_token");
          setToken(null);
          setIsLoading(false);
        });
    }

    // Firebase Auth Listener for Students
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch the user record from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              role: data.role || "Student",
              student_number: data.student_number,
              status: data.account_status || "Active",
              email: firebaseUser.email || data.email,
              avatar_id: data.avatar_id,
              display_name: data.display_name
            });
          } else {
            // First time login - Create the user document logically if missing
            const studentNum = firebaseUser.email?.split('@')[0] || "Unknown";
            const newUserDoc = {
               user_id: firebaseUser.uid,
               student_number: studentNum,
               role: "Student",
               account_status: "Active",
               created_at: new Date().toISOString()
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUserDoc);
            setUser({
              id: firebaseUser.uid,
              role: "Student",
              student_number: studentNum,
              status: "Active",
              email: firebaseUser.email || undefined
            });
          }
        } catch (error) {
          console.error("Error fetching Firestore user:", error);
        }
      } else {
        // If no firebase user, and also no legacy Admin user
        if (!localStorage.getItem("admin_token")) {
           setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (userData: User, newToken?: string) => {
    setUser(userData);
    if (newToken && userData.role === "Admin") {
      setToken(newToken);
      localStorage.setItem("admin_token", newToken);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("admin_token");
    await firebaseSignOut(auth);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
