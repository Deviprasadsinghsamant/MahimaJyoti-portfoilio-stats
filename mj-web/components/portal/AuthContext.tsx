"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { User } from "firebase/auth";
import { onAuthChange, signOut as fbSignOut, fetchPortalUser, getUserRole } from "@/lib/auth";
import type { PortalUser, UserRole } from "@/domain/portal/types";

interface AuthContextValue {
    firebaseUser: User | null;
    portalUser: PortalUser | null;
    role: UserRole | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [portalUser, setPortalUser] = useState<PortalUser | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthChange(async (user) => {
            setFirebaseUser(user);
            if (!user) {
                setPortalUser(null);
                setRole(null);
                setLoading(false);
                return;
            }
            const [claimRole, profile] = await Promise.all([
                getUserRole(user),
                fetchPortalUser(user.uid),
            ]);
            setRole(claimRole);
            setPortalUser(profile);
            setLoading(false);
        });
        return unsub;
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            firebaseUser,
            portalUser,
            role,
            loading,
            signOut: async () => {
                await fbSignOut();
            },
        }),
        [firebaseUser, portalUser, role, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
