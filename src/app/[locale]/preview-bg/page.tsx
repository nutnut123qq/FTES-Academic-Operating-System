"use client"

import React, {
    useMemo,
    useState,
} from "react"
import {
    Typography,
    Button,
} from "@heroui/react"

/**
 * Dev-only sandbox to compare animated "fire" backgrounds before adopting one
 * app-wide. Three variants render full-bleed behind sample content so the effect
 * can be judged against real cards/text. NOT linked in nav — open `/preview-bg`.
 *
 * All motion is pure CSS (transform/opacity only → GPU-cheap, no rAF loop). The
 * keyframes are injected once via a `<style>` tag so this page stays self-contained
 * and never pollutes `globals.css` until a variant is picked.
 */
export default function PreviewBackgroundPage() {
    /** Which variant fills the stage. */
    const [variant, setVariant] = useState<"rose" | "classic" | "ember">("rose")

    const variants: Array<{ key: "rose" | "classic" | "ember"; label: string }> = [
        { key: "rose", label: "A · Rose Aurora (on-brand)" },
        { key: "classic", label: "B · Classic Fire (cam/đỏ)" },
        { key: "ember", label: "C · Ember Field (tro bay)" },
    ]

    return (
        <div className="relative min-h-screen w-full bg-background">
            <PreviewKeyframes />

            {/* the animated layer under everything */}
            {variant === "rose" ? <RoseAurora /> : null}
            {variant === "classic" ? <ClassicFire /> : null}
            {variant === "ember" ? <EmberField /> : null}

            {/* foreground: variant switcher + sample content to judge legibility */}
            <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {variants.map((option) => (
                        <Button
                            key={option.key}
                            size="sm"
                            variant={option.key === variant ? "primary" : "tertiary"}
                            onPress={() => setVariant(option.key)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-3 text-center">
                    <Typography type="h1" weight="bold">
                        Lửa bùng bùng 🔥
                    </Typography>
                    <Typography type="body" color="muted">
                        Nền động đứng sau nội dung. Xem chữ còn đọc rõ không, hiệu ứng có rối mắt không.
                    </Typography>
                </div>

                {/* sample card sitting on the bg — checks surface contrast over flames */}
                <div className="flex w-full flex-col gap-3 rounded-2xl bg-surface/80 p-6 shadow-lg backdrop-blur-md">
                    <Typography type="h4" weight="semibold">
                        Thẻ nội dung mẫu
                    </Typography>
                    <Typography type="body" color="muted">
                        Card dùng `bg-surface/80` + blur để nổi trên nền lửa mà vẫn thấy ánh động phía sau.
                        Nếu nền quá mạnh, hạ opacity/scale của lửa xuống.
                    </Typography>
                    <div className="flex gap-2">
                        <Button variant="primary" size="sm">Nút chính</Button>
                        <Button variant="tertiary" size="sm">Phụ</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Variant A — Rose Aurora: on-brand pink/magenta flame glow (subtle). */
/* ------------------------------------------------------------------ */

/** Soft licking flames in the brand rose hue — premium, not literal. */
const RoseAurora = () => (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* three blurred blobs anchored low, breathing at different speeds */}
        <div
            className="absolute -bottom-32 left-[10%] size-[44rem] rounded-full blur-3xl"
            style={{
                background: "radial-gradient(circle, oklch(70% 0.21 354 / 0.45), transparent 70%)",
                animation: "flameBreathe 6s ease-in-out infinite",
            }}
        />
        <div
            className="absolute -bottom-40 left-[42%] size-[40rem] rounded-full blur-3xl"
            style={{
                background: "radial-gradient(circle, oklch(75% 0.18 12 / 0.40), transparent 70%)",
                animation: "flameBreathe 8s ease-in-out infinite 1s",
            }}
        />
        <div
            className="absolute -bottom-36 right-[8%] size-[46rem] rounded-full blur-3xl"
            style={{
                background: "radial-gradient(circle, oklch(72% 0.20 330 / 0.42), transparent 70%)",
                animation: "flameBreathe 7s ease-in-out infinite 0.5s",
            }}
        />
        <Embers tone="rose" count={26} />
    </div>
)

/* ------------------------------------------------------------------ */
/* Variant B — Classic Fire: warm orange/red/amber blaze.             */
/* ------------------------------------------------------------------ */

/** Literal campfire — warm tongues climbing from the bottom edge. */
const ClassicFire = () => (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* warm base glow hugging the bottom */}
        <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
                background: "linear-gradient(to top, oklch(70% 0.20 40 / 0.55), oklch(72% 0.21 25 / 0.18) 45%, transparent)",
            }}
        />
        {/* flickering tongues */}
        {[15, 38, 55, 72, 88].map((left, index) => (
            <div
                key={left}
                className="absolute bottom-[-6rem] size-[28rem] rounded-full blur-3xl"
                style={{
                    left: `${left}%`,
                    transform: "translateX(-50%)",
                    background: index % 2 === 0
                        ? "radial-gradient(circle, oklch(75% 0.21 55 / 0.55), transparent 65%)"
                        : "radial-gradient(circle, oklch(68% 0.22 28 / 0.55), transparent 65%)",
                    animation: `flameFlicker ${3 + (index % 3)}s ease-in-out infinite ${index * 0.4}s`,
                }}
            />
        ))}
        <Embers tone="warm" count={40} />
    </div>
)

/* ------------------------------------------------------------------ */
/* Variant C — Ember Field: calm dark base, rising sparks only.        */
/* ------------------------------------------------------------------ */

/** Minimal: faint bottom glow + lots of slow rising sparks. */
const EmberField = () => (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
            className="absolute inset-x-0 bottom-0 h-2/3"
            style={{
                background: "radial-gradient(120% 80% at 50% 120%, oklch(70% 0.21 354 / 0.30), transparent 70%)",
            }}
        />
        <Embers tone="rose" count={60} />
    </div>
)

/* ------------------------------------------------------------------ */
/* Shared embers — deterministic rising sparks (no Math.random in SSR).*/
/* ------------------------------------------------------------------ */

/** Props for {@link Embers}. */
interface EmbersProps {
    /** Colour family of the sparks. */
    tone: "rose" | "warm"
    /** How many sparks to spawn. */
    count: number
}

/** A field of small dots drifting upward, fading as they rise. */
const Embers = ({ tone, count }: EmbersProps) => {
    // deterministic pseudo-random so server + client markup match (no hydration warn)
    const sparks = useMemo(
        () =>
            Array.from({ length: count }).map((_, index) => {
                const seed = (index * 2654435761) % 1000 / 1000
                const seed2 = (index * 40503) % 997 / 997
                const left = Math.round(seed * 100)
                const size = 2 + Math.round(seed2 * 4)
                const duration = 6 + Math.round(seed * 8)
                const delay = Math.round(seed2 * 10 * 10) / 10
                const drift = Math.round((seed - 0.5) * 80)
                return { index, left, size, duration, delay, drift }
            }),
        [count],
    )

    const color = tone === "warm"
        ? "oklch(80% 0.20 60)"
        : "oklch(75% 0.20 354)"

    return (
        <>
            {sparks.map((spark) => (
                <span
                    key={spark.index}
                    className="absolute bottom-0 rounded-full"
                    style={{
                        left: `${spark.left}%`,
                        width: `${spark.size}px`,
                        height: `${spark.size}px`,
                        background: color,
                        boxShadow: `0 0 ${spark.size * 2}px ${color}`,
                        // CSS var feeds the horizontal drift into the keyframe
                        ["--drift" as string]: `${spark.drift}px`,
                        animation: `emberRise ${spark.duration}s linear infinite ${spark.delay}s`,
                        opacity: 0,
                    }}
                />
            ))}
        </>
    )
}

/** Injects the keyframes once (kept out of globals until a variant is chosen). */
const PreviewKeyframes = () => (
    <style>{`
        @keyframes flameBreathe {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.85; }
            50% { transform: translateY(-24px) scale(1.12); opacity: 1; }
        }
        @keyframes flameFlicker {
            0%, 100% { transform: translateX(-50%) translateY(0) scaleY(1); opacity: 0.8; }
            25% { transform: translateX(-50%) translateY(-18px) scaleY(1.15); opacity: 1; }
            60% { transform: translateX(-50%) translateY(-8px) scaleY(0.95); opacity: 0.9; }
        }
        @keyframes emberRise {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 1; }
            80% { opacity: 0.8; }
            100% { transform: translateY(-100vh) translateX(var(--drift, 0)); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
            [style*="emberRise"], [style*="flameBreathe"], [style*="flameFlicker"] {
                animation: none !important;
            }
        }
    `}</style>
)
