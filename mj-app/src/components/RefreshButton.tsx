// Manual refresh: downloads every child's marks and attendance again — the
// fallback if pushes were missed. Allowed once every 24 hours per child. Used by
// the refresh icon and by pull-to-refresh.
import { useCallback } from "react";
import { Alert } from "react-native";
import { useStore } from "../lib/store";
import { RefreshCw } from "./icons";
import { IconButton } from "./ui";

export function useRefresh(): () => Promise<void> {
    const { refreshAll } = useStore();
    return useCallback(async () => {
        const notice = await refreshAll();
        if (notice) Alert.alert(notice.title, notice.body);
    }, [refreshAll]);
}

export function RefreshButton() {
    const { refreshing } = useStore();
    const refresh = useRefresh();
    return <IconButton icon={RefreshCw} label="Refresh results" onPress={refresh} busy={refreshing} />;
}
