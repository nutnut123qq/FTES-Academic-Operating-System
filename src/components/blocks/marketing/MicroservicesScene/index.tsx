import React from "react"
import { cn, Typography } from "@heroui/react"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Isometric face palette per tone (top lightest → right darkest, for the 3D read).
 * Hard-coded hexes: it's an illustration (canvas/SVG art), tuned for the dark hero. */
const TONE = {
    neutral: { top: "#3b4250", left: "#2b313d", right: "#212732", stroke: "#181d25", glyph: "#5b6475" },
    accent: { top: "#e873a3", left: "#c4527f", right: "#9e3d63", stroke: "#7a2e4b", glyph: "#ffd3e4" },
    danger: { top: "#e2605f", left: "#b23e3e", right: "#8f2f2f", stroke: "#6e2424", glyph: "#ffd2d2" },
} as const

type Tone = keyof typeof TONE

/** A K8s-style pod as an isometric cube (top + 2 side faces + a container glyph on top). */
const IsoPod = ({ x, y, tone = "neutral" }: { x: number; y: number; tone?: Tone }) => {
    const c = TONE[tone]
    return (
        <g transform={`translate(${x} ${y})`}>
            <polygon points="0,-20 42,0 0,20 -42,0" fill={c.top} stroke={c.stroke} strokeWidth="0.5" />
            <polygon points="-42,0 0,20 0,64 -42,44" fill={c.left} stroke={c.stroke} strokeWidth="0.5" />
            <polygon points="0,20 42,0 42,44 0,64" fill={c.right} stroke={c.stroke} strokeWidth="0.5" />
            {/* container glyph inset on the top face */}
            <polygon points="0,-9 19,1.5 0,12 -19,1.5" fill={c.glyph} opacity="0.55" />
        </g>
    )
}

/** A datastore as an isometric stacked cylinder. */
const IsoDb = ({ x, y, tone = "neutral" }: { x: number; y: number; tone?: Tone }) => {
    const c = TONE[tone]
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M-30,0 L-30,40 A30,14 0 0 0 30,40 L30,0 Z" fill={c.left} stroke={c.stroke} strokeWidth="0.5" />
            <ellipse cx="0" cy="20" rx="30" ry="14" fill="none" stroke={c.stroke} strokeWidth="0.5" opacity="0.6" />
            <ellipse cx="0" cy="0" rx="30" ry="14" fill={c.top} stroke={c.stroke} strokeWidth="0.5" />
        </g>
    )
}

/** A service (svc) as a flat isometric hexagon node. */
const IsoSvc = ({ x, y, tone = "neutral" }: { x: number; y: number; tone?: Tone }) => {
    const c = TONE[tone]
    return (
        <g transform={`translate(${x} ${y})`}>
            <polygon points="0,-22 24,-9 24,15 0,28 -24,15 -24,-9" fill={c.top} stroke={c.stroke} strokeWidth="0.5" />
            <circle cx="0" cy="3" r="6" fill="none" stroke={c.glyph} strokeWidth="1.5" opacity="0.7" />
        </g>
    )
}

/** Props for {@link MicroservicesScene}. */
export interface MicroservicesSceneProps extends WithClassNames<undefined> {
    /** Caption under the scene (i18n string from the feature). */
    caption?: ReactNode
}

/**
 * Coded hero illustration: an isometric "mini infra" in the cloud-native isometric style
 * (pod cubes behind a service, a single-node datastore) — the System Design / DevOps value
 * prop made visible. The focal node is accent, the single-node DB is the failure point
 * (danger) with the bottleneck flagged. Pure SVG (no image, no WebGL); a packet dot flows
 * down a wire via CSS. Tier-3 block — owns styling; `caption` is i18n from the feature.
 *
 * @param props - {@link MicroservicesSceneProps}
 */
export const MicroservicesScene = ({ caption, className }: MicroservicesSceneProps) => {
    return (
        <div className={cn("w-full", className)}>
            <svg viewBox="0 0 680 480" width="100%" role="img" aria-label="Isometric mini infrastructure">
                {/* connectors (svc → pods → DB) */}
                <g fill="none" strokeLinecap="round">
                    <path d="M340,150 L250,200" stroke="#5b6473" strokeWidth="1.5" />
                    <path d="M340,150 L340,212" stroke="#5b6473" strokeWidth="1.5" />
                    <path d="M340,150 L440,200" stroke="#5b6473" strokeWidth="1.5" />
                    {/* pods → single DB (the hot path that bottlenecks) */}
                    <path d="M340,300 L520,300" stroke="#b23e3e" strokeWidth="1.8" />
                    {/* flowing packet down the entry wire */}
                    <circle r="3.5" fill="#e873a3">
                        <animateMotion dur="2.2s" repeatCount="indefinite" path="M340,118 L340,150" />
                    </circle>
                </g>

                {/* ingress / service in front of the deployment */}
                <IsoSvc x={340} y={128} tone="neutral" />
                <text x={364} y={132} fontFamily="sans-serif" fontSize="12" fill="#cbd5e1">Service · LB</text>

                {/* the deployment: 3 pods (one is the focal/accent gateway pod) */}
                <IsoPod x={250} y={210} tone="neutral" />
                <IsoPod x={340} y={232} tone="accent" />
                <IsoPod x={440} y={210} tone="neutral" />
                <text x={300} y={300} fontFamily="sans-serif" fontSize="12" fill="#f4a9c7">Deployment · 3 pods</text>

                {/* single-node datastore = the bottleneck */}
                <IsoDb x={550} y={262} tone="danger" />
                <text x={512} y={330} fontFamily="sans-serif" fontSize="11" fill="#fca5a5">Postgres · 1 node</text>

                {/* failure flag */}
                <g transform="translate(470 250)">
                    <text x={0} y={0} fontFamily="sans-serif" fontSize="11" fill="#e2605f">⚠ single DB → bottleneck</text>
                </g>

                {/* legend */}
                <circle cx="232" cy="420" r="5" fill="#e873a3" />
                <text x="242" y="424" fontFamily="sans-serif" fontSize="11" fill="#94a3b8">focal pod</text>
                <circle cx="334" cy="420" r="5" fill="#e2605f" />
                <text x="344" y="424" fontFamily="sans-serif" fontSize="11" fill="#94a3b8">where it breaks</text>
            </svg>
            {caption ? (
                <Typography type="body-sm" color="muted" align="center" className="px-5">
                    {caption}
                </Typography>
            ) : null}
        </div>
    )
}
