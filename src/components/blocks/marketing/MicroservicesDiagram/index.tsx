"use client"

import React from "react"
import { Chip, cn, Typography } from "@heroui/react"
import { CaretRightIcon, WarningIcon } from "@phosphor-icons/react"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import type { CSSProperties, ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One node in the curated topology. */
interface DiagramNode {
    /** Node name (e.g. "API Gateway"). */
    name: string
    /** Sub-label / tech tag (e.g. "Rate-limit · Authz"). */
    sub: string
    /** Visual tone: `accent` = focal node · `danger` = failure point. Omitted = neutral
     * surface — only the focal + problem nodes carry tone (keeps the diagram from going
     * rainbow; data stores read neutral). */
    tone?: "accent" | "danger"
}

/** Curated microservices topology (a marketing illustration, not live data). */
const TIERS: ReadonlyArray<ReadonlyArray<DiagramNode>> = [
    [{ name: "Client", sub: "Web · Mobile" }],
    [{ name: "Load Balancer", sub: "Round-Robin" }],
    [{ name: "API Gateway", sub: "Rate-limit · Authz", tone: "accent" }],
    [
        { name: "Auth", sub: "JWT" },
        { name: "Order", sub: "gRPC" },
        { name: "Payment", sub: "Sync", tone: "danger" },
    ],
    [
        { name: "Postgres", sub: "1 Node", tone: "danger" },
        { name: "Redis", sub: "Cache" },
        { name: "Kafka", sub: "Events" },
    ],
]

/**
 * Failure annotations — each floats next to the TIER whose weakness it names, top→bottom
 * along the request path, so the content reads as one coherent "what's wrong with this
 * naive v2" story (System Design teaches you to spot + fix these):
 *  - EDGE  (Load Balancer / single gateway funnel, no surge protection) → a spike overloads it.
 *  - SERVICE (Payment's SYNC call blocks the thread) → the failure cascades upstream.
 *  - DATA  (one Postgres node = single writer) → it becomes the bottleneck + SPOF.
 */
const FAILURES: ReadonlyArray<{ from: string; to: string; pos: string }> = [
    // sits right beside the entry wire (Client → LB) where the red spike pours in
    { from: "spike", to: "overload", pos: "left-[53%] top-[14%]" },
    { from: "sync call", to: "cascade", pos: "right-3 top-[60%]" },
    // tucked tight against Postgres's top-left (mirrors the cascade chip on Payment)
    { from: "single DB", to: "bottleneck", pos: "left-3 bottom-16" },
]

/** Props for {@link MicroservicesDiagram}. */
export interface MicroservicesDiagramProps extends WithClassNames<undefined> {
    /** Caption under the diagram (i18n string from the feature). */
    caption?: ReactNode
}

/** Node card class by tone — normal surface card; `backdrop-blur` so the slightly-transparent
 * neutral fill (see {@link nodeStyle}) reads as glass over the glow, not muddy. Tone shown via
 * border colour; fill via inline {@link nodeStyle}. */
const nodeClass = (tone?: DiagramNode["tone"]) => cn(
    "flex min-w-24 flex-col items-center rounded-xl border bg-surface px-3 py-2 text-center backdrop-blur-md",
    tone === "accent" ? "border-accent" : tone === "danger" ? "border-danger" : "border-default",
)

/** GLASS fill only: every node tone mixed to ~30% alpha over transparent (+ `backdrop-blur` on
 * the node) so the glow + dot-grid show through uniformly — accent/danger keep their hue,
 * neutral uses surface. NO per-node shadow/glow box-shadow; atmosphere comes from the section
 * backdrop glow alone. */
const nodeStyle = (tone: DiagramNode["tone"]): CSSProperties => {
    const base = tone === "accent"
        ? "var(--accent)"
        : tone === "danger"
            ? "var(--danger)"
            : "var(--surface)"
    return { background: `color-mix(in oklch, ${base} 30%, transparent)` }
}

/**
 * Coded hero illustration: a microservices topology (`order-service.v2`) framed in a
 * window over a blueprint dot-grid, with the focal node in accent (glow) + the failure
 * points (cascade / bottleneck / overload) floating beside the area they threaten. Nodes
 * stagger in, the failure chips float gently, and a data "packet" flows down each wire —
 * all via Framer Motion / CSS, honouring `prefers-reduced-motion`. Pure CSS surface, no
 * image. Topology is a curated marketing illustration; `caption` is i18n from the feature.
 *
 * @param props - {@link MicroservicesDiagramProps}
 */
export const MicroservicesDiagram = ({ caption, className }: MicroservicesDiagramProps) => {
    const reduce = useReducedMotion()

    // node entrance: stagger fade-rise (no transform when reduced motion is preferred)
    const containerVariants: Variants = {
        show: { transition: { staggerChildren: reduce ? 0 : 0.05, delayChildren: reduce ? 0 : 0.1 } },
    }
    const nodeVariants: Variants = reduce
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

    return (
        // No card/window surface — just the diagram floating over a soft coloured glow
        // (FTES AOS triad). The glow is the only "backdrop"; nodes/wires/chips sit on top.
        <div className={cn("relative w-full", className)}>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                    transform: "scale(1.1)",
                    background:
                        "radial-gradient(40% 40% at 28% 30%, var(--accent), transparent 72%)," +
                        "radial-gradient(40% 40% at 74% 76%, var(--warning), transparent 72%)," +
                        "radial-gradient(32% 32% at 55% 56%, var(--success), transparent 72%)",
                    filter: "blur(46px)",
                    opacity: 0.4,
                }}
            />
            {/* content over a faint blueprint dot-grid; relative so failure chips can float */}
            <motion.div
                className="relative flex flex-col items-center gap-2 p-5"
                style={{
                    backgroundImage: "radial-gradient(color-mix(in oklch, var(--foreground) 7%, transparent) 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                }}
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
            >
                {TIERS.map((tier, index) => (
                    <React.Fragment key={tier.map((node) => node.name).join("-")}>
                        {index > 0 ? (
                            // vertical wire + a data "packet" flowing down it (orthogonal, staggered).
                            // the ENTRY wire (Client → LB, from the FE) carries a RED packet — the
                            // traffic spike pouring in that overloads the edge.
                            <span
                                aria-hidden
                                className={cn("relative h-6 w-px", index === 1 ? "bg-danger/25" : "bg-foreground/12")}
                            >
                                <span
                                    className={cn(
                                        "absolute left-1/2 top-0 rounded-full",
                                        index === 1
                                            ? "size-2 bg-danger shadow-[0_0_9px_var(--danger)]"
                                            : "size-1.5 bg-accent shadow-[0_0_6px_var(--accent)]",
                                    )}
                                    style={{ animation: reduce ? undefined : `wireFlow ${index === 1 ? "0.75s" : "1.6s"} linear ${index * 0.18}s infinite` }}
                                />
                            </span>
                        ) : null}
                        <div className="flex flex-wrap items-stretch justify-center gap-2">
                            {tier.map((node) => (
                                <motion.div
                                    key={node.name}
                                    variants={nodeVariants}
                                    className={cn("relative", nodeClass(node.tone))}
                                    style={nodeStyle(node.tone)}
                                >
                                    {/* plain spans in the body sans font (Open Sans) — NOT
                                        Typography type="code", whose `bg-default` adds a pill */}
                                    <span className="text-xs font-medium text-foreground">{node.name}</span>
                                    <span className="text-[10px] text-muted">{node.sub}</span>
                                </motion.div>
                            ))}
                        </div>
                    </React.Fragment>
                ))}

                {/* failure points — Chip (bg-danger/10, đồng bộ chip toàn app) floated beside the
                    area they threaten, drifting gently */}
                {FAILURES.map((failure, index) => (
                    <motion.div
                        key={`${failure.from}-${failure.to}`}
                        className={cn("absolute", failure.pos)}
                        animate={reduce ? undefined : { y: [0, -4, 0] }}
                        transition={reduce ? undefined : { repeat: Infinity, duration: 3 + index * 0.5, ease: "easeInOut" }}
                    >
                        <Chip size="sm" className="bg-danger/10 text-danger">
                            <WarningIcon aria-hidden focusable="false" className="size-3" />
                            <Chip.Label className="inline-flex items-center gap-1">
                                {failure.from}
                                <CaretRightIcon aria-hidden focusable="false" className="size-3" />
                                {failure.to}
                            </Chip.Label>
                        </Chip>
                    </motion.div>
                ))}
            </motion.div>

            {caption ? (
                <Typography type="body-sm" color="muted" align="center" className="px-5 pb-5">
                    {caption}
                </Typography>
            ) : null}
        </div>
    )
}
