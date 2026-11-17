// Home: the welcome screen, or the parent or teacher home — whichever this phone
// was last used as. Rendered in place (not redirected) so it stays the stack's
// anchor under every other screen.
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../components/theme";
import { useMode } from "../lib/mode";
import { useStore } from "../lib/store";
import { useTeacher } from "../lib/teacher";
import { ParentHome } from "../screens/ParentHome";
import { TeacherHome } from "../screens/TeacherHome";
import { Welcome } from "../screens/Welcome";

export default function HomeScreen() {
    const { mode, loaded: modeLoaded } = useMode();
    const { state, loaded } = useStore();
    const teacher = useTeacher();

    if (!modeLoaded || !loaded || !teacher.ready) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.onBrand} size="large" />
            </View>
        );
    }
    if (mode === "teacher" && teacher.signedIn) return <TeacherHome />;
    if (mode === "parent" && state.children.length > 0) return <ParentHome />;
    return <Welcome />;
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand },
});
