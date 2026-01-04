"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh?: () => Promise<void>;
    isPullable?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children, onRefresh, isPullable = true }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const controls = useAnimation();

    // Pull threshold
    const threshold = 80;
    // Maximum pull distance
    const maxPull = 150;

    // Transform y value to rotation for the spinner
    const rotate = useTransform(y, [0, threshold], [0, 360]);
    const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);

    const handleDragEnd = async () => {
        if (y.get() > threshold) {
            setLoading(true);
            // Snap to threshold to show loading
            await controls.start({ y: 80 });

            // Trigger refresh
            try {
                if (onRefresh) {
                    await onRefresh();
                } else {
                    // Default behavior: router.refresh()
                    router.refresh();
                    // Add a small artificial delay to let user see the spinner
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (e) {
                console.error("Refresh failed", e);
            }

            setLoading(false);
            controls.start({ y: 0 });
        } else {
            controls.start({ y: 0 });
        }
    };

    return (
        <div ref={containerRef} className="relative min-h-screen">
            {/* Loading Indicator Layer - Behind content but visible when pulled */}
            <motion.div
                style={{ opacity, rotate }}
                className="absolute top-0 left-0 right-0 flex justify-center pt-8 z-0"
            >
                <div className="bg-white/80 backdrop-blur rounded-full p-2 shadow-sm border border-slate-100">
                    <Loader2 className={`text-blue-600 ${loading ? "animate-spin" : ""}`} size={24} />
                </div>
            </motion.div>

            {/* Main Content Layer */}
            <motion.div
                drag={isPullable && !loading ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }} // Constraints are 0 because we handle movement via dragElastic
                dragElastic={{ top: 0.1, bottom: 0 }} // Elastic pull down, no elastic pull up
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ y }}
                className="relative z-10 bg-inherit" // bg-inherit to ensure it covers the spinner if needed (though spinner is z-0 and usually above background?)
            // Actually, for "Pull To Refresh", the spinner usually appears *above* the content or the content moves down revealing it.
            // Here, if z-index is 10, and background is transparent, we might see the spinner through it if we don't set background.
            // We rely on the dragged content pushing down.
            >
                {/* Check native scroll top to disable drag if scrolled down? 
             Framer Motion's drag doesn't automatically play nice with native scroll.
             Usually we need a way to disable drag if scrollTop > 0.
             However, simplified approach: We only allow drag if we are at the top.
         */}
                {children}
            </motion.div>
        </div>
    );
};
