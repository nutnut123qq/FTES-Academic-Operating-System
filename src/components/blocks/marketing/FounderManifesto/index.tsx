import React from "react"
import { cn, Typography } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SectionCard } from "@/components/reuseable/SectionCard"

/** Props for the {@link FounderManifesto} block. */
export interface FounderManifestoProps extends WithClassNames<undefined> {
    /** Editorial thesis — the big serif hook that opens the letter (the "why"). */
    thesis?: React.ReactNode
    /** Founder portrait node (image or fallback IconTile/avatar). */
    portrait: React.ReactNode
    /** Founder name. */
    name: React.ReactNode
    /** Founder role / tagline. */
    role: React.ReactNode
    /** Manifesto body — pass paragraphs as a rich node. */
    body: React.ReactNode
    /** Optional links row (GitHub / blog / etc.). */
    links?: React.ReactNode
}

/**
 * Founder beat: an authority card — portrait on the left, then name + role/titles,
 * the message body (titles · expertise chips · quote · note), and real links
 * (GitHub / blog) as proof, all flowing in the content column. Portrait stacks above
 * the copy on mobile, sits beside it on `sm+`. Tier-3 block on {@link SectionCard} —
 * owns styling, content via props.
 *
 * @param props - {@link FounderManifestoProps}
 */
export const FounderManifesto = ({
    thesis,
    portrait,
    name,
    role,
    body,
    links,
    className,
}: FounderManifestoProps) => {
    return (
        <SectionCard className={cn(className)} contentClassName="flex flex-col gap-6">
            {/* editorial hook — a large pull-quote that leads the letter. SANS (not
                serif): the serif fallback mangles Vietnamese diacritics; the accent
                left-rule + size carry the editorial weight instead. */}
            {thesis ? (
                <blockquote className="border-l-2 border-accent/60 pl-4 text-xl leading-snug font-medium text-foreground sm:text-2xl">
                    {thesis}
                </blockquote>
            ) : null}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="shrink-0">{portrait}</div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-col gap-0.5">
                        <Typography type="h5" weight="semibold">
                            {name}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {role}
                        </Typography>
                    </div>
                    {body}
                    {links ? <div className="flex flex-wrap items-center gap-3">{links}</div> : null}
                </div>
            </div>
        </SectionCard>
    )
}
