// A circular percentage, e.g. an exam's overall score.
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export function ScoreRing({
    percent,
    size = 104,
    stroke = 10,
    color,
    track,
    children,
}: {
    percent: number;
    size?: number;
    stroke?: number;
    color: string;
    track: string;
    children?: ReactNode;
}) {
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const shown = Math.min(100, Math.max(0, percent));
    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={circumference * (1 - shown / 100)}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={styles.center}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
});
