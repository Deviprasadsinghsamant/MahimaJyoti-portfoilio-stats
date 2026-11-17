// Sign in with a child's Student ID and a mobile number on the school's record.
// Used for the first child and for adding brothers and sisters later.
import { useRef, useState } from "react";
import { StyleSheet, Text, type TextInputInstance, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { ArrowRight, IdCard, Phone, ShieldCheck } from "../components/icons";
import { SignInLayout } from "../components/SignInLayout";
import { TextLink } from "../components/TextLink";
import { colors } from "../components/theme";
import { Notice } from "../components/ui";
import { useMode } from "../lib/mode";
import { useStore } from "../lib/store";
import { normalizeMobile, normalizeStudentCode } from "../lib/validate";

export default function AddChildScreen() {
    const { state, addChild } = useStore();
    const { setMode } = useMode();
    const router = useRouter();
    const phoneRef = useRef<TextInputInstance>(null);
    const [studentCode, setStudentCode] = useState("");
    const [phone, setPhone] = useState("");
    const [touched, setTouched] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const firstChild = state.children.length === 0;
    const codeError = touched && !normalizeStudentCode(studentCode) ? "Enter the Student ID, e.g. MJ0042." : null;
    const phoneError = touched && !normalizeMobile(phone) ? "Enter a 10-digit mobile number." : null;

    async function handleSubmit() {
        setTouched(true);
        setError(null);
        if (!normalizeStudentCode(studentCode) || !normalizeMobile(phone)) return;
        setBusy(true);
        try {
            const studentId = await addChild(studentCode, phone);
            setMode("parent");
            router.replace(`/student/${studentId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
            setBusy(false);
        }
    }

    return (
        <>
            <Stack.Screen options={{ title: firstChild ? "Parent sign-in" : "Add a child" }} />
            <SignInLayout
                eyebrow={firstChild ? "Parent" : "Add a child"}
                title={firstChild ? "Your child's progress" : "Add brother or sister"}
                lead="Use the Student ID given by the school and a mobile number the school has on record for your child."
                below={<TextLink label="Cancel" tone="muted" onPress={() => router.back()} />}
            >
                <Field
                    label="Student ID"
                    icon={IdCard}
                    value={studentCode}
                    onChangeText={setStudentCode}
                    placeholder="MJ0042"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={10}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    error={codeError}
                />
                <Field
                    ref={phoneRef}
                    label="Parent's mobile number"
                    icon={Phone}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="10-digit mobile number"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    maxLength={16}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    error={phoneError}
                />
                {!!error && <Notice tone="danger" text={error} />}
                <Button label={firstChild ? "Sign in" : "Add child"} icon={ArrowRight} onPress={handleSubmit} busy={busy} />
                <View style={styles.safe}>
                    <ShieldCheck size={14} color={colors.success} />
                    <Text style={styles.safeText}>Only numbers on the school&apos;s record can sign in.</Text>
                </View>
            </SignInLayout>
        </>
    );
}

const styles = StyleSheet.create({
    safe: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    safeText: { fontSize: 12, color: colors.muted },
});
