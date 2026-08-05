"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface CounterProps {
    end: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
    label: string;
}

export function AnimatedCounter({
    end,
    suffix = "",
    prefix = "",
    duration = 2,
    label,
}: CounterProps) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        let startTime: number;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isInView, end, duration]);

    return (
        <div ref={ref} className="text-center">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <span className="text-4xl md:text-5xl font-heading font-bold text-gradient-gold">
                    {prefix}
                    {count}
                    {suffix}
                </span>
            </motion.div>
            <p className="mt-2 text-sm text-ivory-400/70 font-medium tracking-wide uppercase">
                {label}
            </p>
        </div>
    );
}
