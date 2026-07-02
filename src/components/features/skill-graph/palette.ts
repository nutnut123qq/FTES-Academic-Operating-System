import type { CSSProperties } from "react"
import type { SkillDomain, SkillStatus } from "./hooks/useQuerySkillGraphSwr"

/**
 * Domain hues, expressed as OKLCH derived from the brand hue family. Defined here
 * (not in components) and injected as scoped CSS variables on the graph root via
 * {@link skillGraphColorVars}, so nodes/legend read `var(--sg-domain-*)` — no raw
 * color literals leak into component render, and dark mode inherits token lightness.
 */
const DOMAIN_OKLCH: Record<SkillDomain, string> = {
    be: "oklch(62% 0.17 264)", // indigo (matches --accent family)
    fe: "oklch(70% 0.15 200)", // cyan
    mobile: "oklch(68% 0.16 150)", // green
    ai: "oklch(66% 0.19 300)", // violet
    data: "oklch(72% 0.15 60)", // amber
    devops: "oklch(66% 0.18 20)", // red-orange
}

/** CSS custom-property name carrying a domain's hue on the graph root. */
export const domainVar = (domain: SkillDomain): string => `var(--sg-domain-${domain})`

/**
 * The scoped CSS variables to spread on the graph root `style` so descendants can
 * read `var(--sg-domain-*)`. Keeps all color decisions token-shaped and themable.
 * @returns A `style`-compatible object of `--sg-domain-*` custom properties.
 */
export const skillGraphColorVars = (): CSSProperties => {
    const vars: Record<string, string> = {}
    for (const domain of Object.keys(DOMAIN_OKLCH) as Array<SkillDomain>) {
        vars[`--sg-domain-${domain}`] = DOMAIN_OKLCH[domain]
    }
    return vars as CSSProperties
}

/** Node diameter (px) scaled by mastery level (0–100). */
export const nodeSizeForLevel = (level: number): number => 44 + Math.round((Math.max(0, Math.min(100, level)) / 100) * 28)

/** Opacity applied to a locked node's fill so it reads as "not yet reached". */
export const statusFillAlpha: Record<SkillStatus, number> = {
    mastered: 1,
    learning: 0.55,
    locked: 0.18,
}
