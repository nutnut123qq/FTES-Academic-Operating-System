import React from "react"
import { cn, Typography } from "@heroui/react"
import type { CSSProperties, ReactNode } from "react"

/**
 * A 3-colour accent triad for the decorative glow behind the mockup.
 *
 * These are ONLY the accent/glow colours — the card surface, chrome and text
 * always follow the app's light/dark theme tokens (`bg-surface` / `border-default`
 * / `text-foreground`), so the same block reads correctly in both modes.
 */
export interface ShowcaseTheme {
    /** Focal colour (top-left glow blob). */
    c1: string
    /** Secondary colour (bottom-right glow blob). */
    c2: string
    /** Tertiary colour (centre glow blob). */
    c3: string
}

/** Ready-made accent triads. Token-based ones adapt to light/dark automatically. */
export const SHOWCASE_THEMES = {
    /** Mono brand glow (subtle). */
    accent: { c1: "var(--accent)", c2: "var(--accent)", c3: "var(--accent)" },
    /** FTES AOS triad: pink · amber · teal (matches the architecture diagram). */
    starci: { c1: "var(--accent)", c2: "var(--warning)", c3: "var(--success)" },
    /** Aqua triad: blue · teal · violet (Uni-Education style). */
    aqua: { c1: "#378ADD", c2: "#1D9E75", c3: "#7F77DD" },
} satisfies Record<string, ShowcaseTheme>

type Tilt = "left" | "right" | "none"
type Backdrop = "glow" | "grid" | "stars" | "none"

/** Props for {@link ShowcaseMockup}. */
export interface ShowcaseMockupProps {
    /** Address-bar text (mono). Omit to hide the address bar (dots only). */
    url?: ReactNode
    /** Accent triad for the glow. Defaults to {@link SHOWCASE_THEMES.accent}. */
    theme?: ShowcaseTheme
    /** Perspective tilt of the card (disabled below `md`). Default `"left"`. */
    tilt?: Tilt
    /** Decorative layer behind the card. Default `"glow"`. */
    backdrop?: Backdrop
    /** Lock the content area to a 16:9 rectangle (a full website preview). */
    aspect?: "video"
    /** The mockup content (rendered under the window chrome). */
    children: ReactNode
    /** Class on the outer wrapper (sizing / placement). */
    className?: string
    /** Class on the content area (padding / inner background). */
    contentClassName?: string
}

/** Tilt presets — a perspective turn + a visible 2D slant (so it reads clearly as
 * "tilted", not flat). Only applied from `md` up (mobile stays flat). */
const TILT: Record<Tilt, string> = {
    left: "md:[transform:perspective(1500px)_rotateX(2deg)_rotateY(8deg)_rotate(-2.5deg)]",
    right: "md:[transform:perspective(1500px)_rotateX(2deg)_rotateY(-8deg)_rotate(2.5deg)]",
    none: "",
}

/** The OPPOSITE tilt — used by the card stacked behind so the two cards splay in two
 * directions (a "fanned" depth) instead of overlapping flat. */
const OPPOSITE: Record<Tilt, Tilt> = { left: "right", right: "left", none: "none" }

/**
 * Reusable "browser window" showcase frame: a chrome-framed card (3 dots + address
 * bar) holding any content, tilted slightly in 3D with a soft coloured glow behind it
 * — the FTES AOS / Uni-Education hero look, as ONE reusable block.
 *
 * Parameterise via props: `theme` (3 accent colours for the glow), `tilt`
 * (left/right/none), `backdrop` (glow/grid/stars/none), `url` + `children`. The card
 * surface itself always follows the app's light/dark theme tokens.
 *
 * @example
 * <ShowcaseMockup url="app.vn/demo" theme={SHOWCASE_THEMES.aqua} tilt="left">
 *   <TutorList />
 * </ShowcaseMockup>
 *
 * @param props - {@link ShowcaseMockupProps}
 */
export const ShowcaseMockup = ({
    url,
    theme = SHOWCASE_THEMES.accent,
    tilt = "left",
    backdrop = "glow",
    aspect,
    children,
    className,
    contentClassName,
}: ShowcaseMockupProps) => (
    <div
        className={cn("relative w-full", className)}
        style={{ "--sc-1": theme.c1, "--sc-2": theme.c2, "--sc-3": theme.c3 } as CSSProperties}
    >
        {/* decorative layer behind the card */}
        {backdrop === "glow" ? (
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                    transform: "scale(1.15)",
                    background:
                        "radial-gradient(38% 38% at 28% 32%, var(--sc-1), transparent 72%)," +
                        "radial-gradient(38% 38% at 74% 74%, var(--sc-2), transparent 72%)," +
                        "radial-gradient(30% 30% at 55% 58%, var(--sc-3), transparent 72%)",
                    filter: "blur(36px)",
                    opacity: 0.5,
                }}
            />
        ) : null}
        {backdrop === "grid" ? (
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                    backgroundImage: "radial-gradient(color-mix(in oklch, var(--foreground) 7%, transparent) 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                }}
            />
        ) : null}
        {backdrop === "stars" ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                {[
                    "left-[8%] top-[14%]", "right-[12%] top-[8%]", "left-[22%] bottom-[12%]",
                    "right-[20%] bottom-[18%]", "left-[46%] top-[6%]", "right-[6%] top-[52%]",
                ].map((pos, index) => (
                    <span
                        key={pos}
                        className={cn("absolute size-1 rounded-full", pos)}
                        style={{ background: `var(--sc-${(index % 3) + 1})`, opacity: 0.6 }}
                    />
                ))}
            </div>
        ) : null}

        {/* the window card + a second card stacked BEHIND it. `group` so hovering
            anywhere flattens both cards together. */}
        <div className="group relative">
            {/* the card BEHIND — a bit TALLER (peeks top + bottom), a surface tinted by the
                theme colour (NO border), tilted the OPPOSITE way so the two cards splay in
                two directions (a "fanned" depth, not a flat overlap). */}
            <div
                aria-hidden
                className={cn(
                    "absolute -inset-y-4 inset-x-8 -z-10 origin-center rounded-3xl transition-transform duration-500 ease-out md:group-hover:[transform:none]",
                    TILT[OPPOSITE[tilt]],
                )}
                style={{ backgroundColor: "color-mix(in oklch, var(--sc-1) 18%, var(--surface))" }}
            />

            {/* the foreground window card — surface follows light/dark tokens, its own tilt */}
            <div
                className={cn(
                    "relative w-full origin-center overflow-hidden rounded-3xl border border-default bg-surface shadow-xl shadow-foreground/5 transition-transform duration-500 ease-out md:group-hover:[transform:none]",
                    TILT[tilt],
                )}
            >
                {/* window chrome */}
                <div className="flex items-center gap-2 border-b border-default px-4 py-2.5">
                    <span aria-hidden className="size-2.5 rounded-full bg-danger" />
                    <span aria-hidden className="size-2.5 rounded-full bg-warning" />
                    <span aria-hidden className="size-2.5 rounded-full bg-success" />
                    {url ? (
                        <Typography type="code" className="ml-2 truncate text-xs text-muted">
                            {url}
                        </Typography>
                    ) : null}
                </div>

                <div className={cn("relative", aspect === "video" && "aspect-video overflow-hidden", contentClassName)}>{children}</div>
            </div>
        </div>
    </div>
)
