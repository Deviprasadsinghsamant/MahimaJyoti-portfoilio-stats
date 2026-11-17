// Teachers sign in with the same phone number and password as on the school website.
import { useRef, useState } from "react";
import { StyleSheet, Text, type TextInputInstance } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { ArrowRight, LockKeyhole, Phone } from "../../components/icons";
import { SignInLayout } from "../../components/SignInLayout";
import { TextLink } from "../../components/TextLink";
import { colors } from "../../components/theme";
import { Notice } from "../../components/ui";
import { useMode } from "../../lib/mode";
import { useTeacher } from "../../lib/teacher";

export default function TeacherSignInScreen() {
    const router = useRouter();
    const { setMode } = useMode();
    const { signIn } = useTeacher();
    const passwordRef = useRef<TextInputInstance>(null);
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        setError(null);
        setBusy(true);
        try {
            await signIn(phone, password);
            setMode("teacher");
            router.back();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
            setBusy(false);
        }
    }

    return (
        <SignInLayout
            eyebrow="Teacher"
            title="Staff sign-in"
            lead="Use the phone number and password you use on the school website."
            below={
                <>
                    <TextLink label="Cancel" tone="muted" onPress={() => router.back()} />
                    <Text style={styles.help}>Forgot your password? The school office can set a new one on the website.</Text>
                </>
            }
        >
            <Field
                label="Phone number"
                icon={Phone}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={16}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <Field
                ref={passwordRef}
                label="Password"
                icon={LockKeyhole}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
            />
            {!!error && <Notice tone="danger" text={error} />}
            <Button label="Sign in" icon={ArrowRight} onPress={handleSubmit} busy={busy} />
        </SignInLayout>
    );
}

const styles = StyleSheet.create({
    help: { fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 18 },
});
