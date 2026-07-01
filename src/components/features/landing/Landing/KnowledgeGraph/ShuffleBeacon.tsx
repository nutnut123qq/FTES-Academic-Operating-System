"use client"

import React, { useCallback, useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowsClockwiseIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

/** How long the ring takes to fill before it auto-reshuffles the graph (ms). */
const PERIOD_MS = 10000
const RADIUS = 10
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Props for {@link ShuffleBeacon}. */
interface ShuffleBeaconProps {
    /** Re-shuffle (re-layout) the graph nodes. */
    onShuffle: () => void
}

/**
 * A DeFi-swap-style countdown beacon: a ring fills over {@link PERIOD_MS}; when full it
 * auto-reshuffles the graph (re-runs the force layout into a fresh arrangement), then
 * restarts. Clicking it reshuffles immediately + restarts the ring. Honours reduced-
 * motion (no auto-cadence; the manual tap still works). Sits in the graph's bottom-left.
 *
 * @param props - {@link ShuffleBeaconProps}
 */
export const ShuffleBeacon = ({ onShuffle }: ShuffleBeaconProps) => {
    const t = useTranslations()
    const reduce = useReducedMotion()
    // bump to restart the ring (auto-fire on cooldown, or manual tap)
    const [cycle, setCycle] = useState(0)

    useEffect(() => {
        if (reduce) {
            return
        }
        const id = setTimeout(() => {
            onShuffle()
            setCycle((value) => value + 1)
        }, PERIOD_MS)
        return () => clearTimeout(id)
    }, [cycle, onShuffle, reduce])

    const trigger = useCallback(() => {
        onShuffle()
        setCycle((value) => value + 1)
    }, [onShuffle])

    return (
        <button
            type="button"
            onClick={trigger}
            title={t("landing.treasure.beaconTap")}
            aria-label={t("landing.treasure.beaconTap")}
            className="nodrag nopan group flex cursor-pointer items-center gap-2 rounded-full border border-default bg-surface/80 py-1.5 pr-3 pl-1.5 text-xs text-muted backdrop-blur-sm transition-colors hover:text-foreground"
        >
            <span className="relative inline-flex size-6 items-center justify-center">
                <svg viewBox="0 0 26 26" className="size-6 -rotate-90">
                    <circle cx="13" cy="13" r={RADIUS} fill="none" stroke="var(--default)" strokeWidth="2.5" />
                    {reduce ? null : (
                        <motion.circle
                            key={cycle}
                            cx="13"
                            cy="13"
                            r={RADIUS}
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={CIRCUMFERENCE}
                            initial={{ strokeDashoffset: CIRCUMFERENCE }}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ duration: PERIOD_MS / 1000, ease: "linear" }}
                        />
                    )}
                </svg>
                <ArrowsClockwiseIcon
                    aria-hidden
                    weight="bold"
                    className="absolute size-3 text-accent transition-transform duration-300 group-hover:rotate-180"
                />
            </span>
            <span className="hidden sm:inline">{t("landing.treasure.beaconLabel")}</span>
        </button>
    )
}
