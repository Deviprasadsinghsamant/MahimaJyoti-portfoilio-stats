// Which side of the app this phone opens on: parent or teacher. Both can be set
// up on one phone (a teacher whose child studies at the school) — the mode only
// picks the home screen, and the welcome screen switches between them.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppMode = "parent" | "teacher";

const KEY = "mj:mode:v1";

interface ModeValue {
    mode: AppMode | null;
    loaded: boolean;
    // null shows the welcome screen.
    setMode: (mode: AppMode | null) => void;
}

const ModeContext = createContext<ModeValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<AppMode | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(KEY)
            .then((raw) => setModeState(raw === "parent" || raw === "teacher" ? raw : null))
            .catch(() => undefined)
            .finally(() => setLoaded(true));
    }, []);

    const setMode = useCallback((next: AppMode | null) => {
        setModeState(next);
        (next ? AsyncStorage.setItem(KEY, next) : AsyncStorage.removeItem(KEY)).catch(() => undefined);
    }, []);

    const value = useMemo(() => ({ mode, loaded, setMode }), [mode, loaded, setMode]);
    return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeValue {
    const value = useContext(ModeContext);
    if (!value) throw new Error("useMode must be used inside <ModeProvider>");
    return value;
}
