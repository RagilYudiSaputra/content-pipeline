"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/services/user.service";
import { UserProfile } from "@/types/user";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AUTH STATE CHANGED:", currentUser?.uid);

      if (currentUser) {
        // User langsung disimpan
        setUser(currentUser);

        // Loading selesai lebih dulu
        setLoading(false);

        try {
          console.log("Mengambil profile...");
          const userProfile = await getUserProfile(currentUser.uid);
          console.log("Profile:", userProfile);

          setProfile(userProfile);
        } catch (error) {
          console.error("Gagal mengambil profile:", error);
          setProfile(null);
        }
      } else {
        console.log("User logout");

        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}