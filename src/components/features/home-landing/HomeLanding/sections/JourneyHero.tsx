"use client"

import React from "react"
import dynamic from "next/dynamic"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { useReducedMotion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { JourneyFallback } from "@/components/blocks/marketing/UserJourneyScene/JourneyFallback"
import type { JourneyStationLabel } from "@/components/blocks/marketing/UserJourneyScene/types"
import { JOURNEY_STATIONS } from "../content"
import { HomeMascotGreeting } from "./HomeMascotGreeting"

/** Auto-advance dwell per stage (ms); the payoff stage dwells longer. */
const ADVANCE_MS = 3200
const PAYOFF_DWELL_MS = 5200

/** `lg` breakpoint (px) — below it we never mount WebGL (spec: mobile = static). */
const LG_PX = 1024

/**
 * The 3D canvas is loaded ONLY through this `ssr:false` dynamic import, so three.js
 * never enters the server (webpack) bundle — the single guard that keeps the build
 * green. While the chunk streams, the static fallback fills the slot (no layout shift).
 */
const UserJourneyScene = dynamic(
    () => import("@/components/blocks/marketing/UserJourneyScene").then((m) => m.UserJourneyScene),
    { ssr: false, loading: () => null },
)

/** Small WebGL error boundary — any Canvas/WebGL throw swaps in the static fallback
 *  so the rest of the landing renders normally (spec scenario). */
class WebglBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
    constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
        super(props)
        this.state = { failed: false }
    }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    render() {
        return this.state.failed ? this.props.fallback : this.props.children
    }
}

/**
 * Hero + user-journey narrative. Left: eyebrow / headline / subline / CTAs + the stage
 * stepper (clickable, keyboard-operable, auto-advancing). Right (`lg:`): the 3D scene,
 * or — under reduced motion / below `lg` / no WebGL / while loading — the static
 * {@link JourneyFallback}. The journey stage TEXT (labels + captions) always renders as
 * DOM (stepper + fallback), so SEO / screen readers never depend on WebGL.
 */
export const JourneyHero = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()
    const reduce = Boolean(useReducedMotion())

    // gate WebGL: only >= lg AND not reduced motion. Resolved client-side after mount
    // (SSR renders the fallback so the HTML always carries the journey text).
    const [canWebgl, setCanWebgl] = React.useState(false)
    const [inView, setInView] = React.useState(false)
    const heroRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const evaluate = () => setCanWebgl(!reduce && window.innerWidth >= LG_PX)
        evaluate()
        window.addEventListener("resize", evaluate)
        return () => window.removeEventListener("resize", evaluate)
    }, [reduce])

    // mount the three chunk only when the hero nears the viewport (perf: keep it off
    // first paint).
    React.useEffect(() => {
        const el = heroRef.current
        if (!el) return
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    io.disconnect()
                }
            },
            { rootMargin: "200px" },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    const [active, setActive] = React.useState(0)
    const [manual, setManual] = React.useState(false)
    const [paused, setPaused] = React.useState(false)

    // labels resolved from i18n (station key → { label, caption }).
    const labels: JourneyStationLabel[] = React.useMemo(
        () =>
            JOURNEY_STATIONS.map((s) => ({
                id: s.key,
                label: t(`journey.stations.${s.key}.label`),
                caption: t(`journey.stations.${s.key}.caption`),
            })),
        [t],
    )

    // auto-advance in journey order; pauses on hover/focus, stops after manual select,
    // dwells on the payoff before looping. Skipped under reduced motion.
    React.useEffect(() => {
        if (reduce || manual || paused) return
        const isPayoff = JOURNEY_STATIONS[active]?.payoff
        const delay = isPayoff ? PAYOFF_DWELL_MS : ADVANCE_MS
        const timer = window.setTimeout(() => {
            setActive((i) => (i + 1) % JOURNEY_STATIONS.length)
        }, delay)
        return () => window.clearTimeout(timer)
    }, [active, reduce, manual, paused])

    const selectStage = (index: number) => {
        setActive(index)
        setManual(true)
    }

    const useCanvas = canWebgl && inView

    return (
        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            {/* text column */}
            <div className="flex flex-col items-start gap-6 text-left">
                {/* FrosTES welcome — the page's single mascot (ambient hero chrome) */}
                <HomeMascotGreeting />
                <Chip variant="soft" color="accent" size="sm">
                    {t("hero.eyebrow")}
                </Chip>
                <Typography type="h1" weight="bold" className="max-w-xl">
                    {t.rich("hero.headline", {
                        accent: (chunks) => <span className="text-accent">{chunks}</span>,
                    })}
                </Typography>
                <Typography type="body" color="muted" className="max-w-xl">
                    {t("hero.subline")}
                </Typography>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" onPress={() => router.push("/courses")}>
                        {t("hero.ctaPrimary")}
                    </Button>
                    <Button variant="secondary" onPress={() => router.push("/community")}>
                        {t("hero.ctaSecondary")}
                    </Button>
                </div>

                {/* stage stepper — the guided journey control (keyboard-operable). */}
                <div
                    className="flex w-full flex-col gap-2"
                    role="tablist"
                    aria-label={t("journey.stepperAria")}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                >
                    {labels.map((station, i) => {
                        const isActive = i === active
                        const isPayoff = JOURNEY_STATIONS[i]?.payoff
                        return (
                            <button
                                key={station.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => selectStage(i)}
                                className={cn(
                                    "flex items-start gap-3 rounded-2xl border px-3 py-2 text-left transition-colors",
                                    isActive
                                        ? isPayoff
                                            ? "border-success bg-success/10"
                                            : "border-accent bg-accent/10"
                                        : "border-transparent hover:bg-default/40",
                                )}
                            >
                                <span
                                    className={cn(
                                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                        isActive
                                            ? isPayoff
                                                ? "bg-success text-success-foreground"
                                                : "bg-accent text-accent-foreground"
                                            : "bg-default text-muted",
                                    )}
                                >
                                    {i + 1}
                                </span>
                                <span className="flex flex-col gap-0">
                                    <Typography type="body-sm" weight="bold" className={cn(isPayoff && "text-success")}>
                                        {station.label}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {station.caption}
                                    </Typography>
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* visual column — 3D scene (>= lg, motion, WebGL) or static journey */}
            <div
                ref={heroRef}
                className="relative min-h-[360px] w-full lg:min-h-[480px]"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                {useCanvas ? (
                    <WebglBoundary fallback={<JourneyFallback labels={labels} activeIndex={active} className="pt-6" />}>
                        <div className="absolute inset-0">
                            <UserJourneyScene labels={labels} activeIndex={active} reduce={reduce} />
                        </div>
                        {/* payoff caption always in DOM under the canvas for crawlers */}
                        <Typography type="body-sm" color="muted" align="center" className="absolute inset-x-0 bottom-2 px-6">
                            {t(`journey.stations.${JOURNEY_STATIONS[active].key}.caption`)}
                        </Typography>
                    </WebglBoundary>
                ) : (
                    <JourneyFallback labels={labels} activeIndex={active} className="pt-6" />
                )}
            </div>
        </section>
    )
}
