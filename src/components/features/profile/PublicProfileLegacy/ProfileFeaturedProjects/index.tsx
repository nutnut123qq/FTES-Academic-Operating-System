"use client"

import React from "react"
import {
    Button,
    Chip,
    Typography,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    Rocket as RocketIcon,
    SealCheck as VerifiedIcon,
    ArrowUpRightFromSquare as ExternalLinkIcon,
    BriefcaseFill as BriefcaseIcon,
    Hammer as HammerIcon,
} from "@gravity-ui/icons"
import {
    useProfileUsername,
} from "../useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useProfileTabStore } from "@/hooks/zustand/profileTab/store"
import { useQueryUserPinnedProjectsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserPinnedProjectsSwr"
import { useQueryUserCapstoneProgressSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCapstoneProgressSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import type { QueryUserPinnedProjectItem } from "@/modules/api/graphql/queries/types/user-pinned-projects"
import type { QueryUserCapstoneCourseProgress } from "@/modules/api/graphql/queries/types/user-capstone-progress"

/** Props for {@link ProfileFeaturedProjects}. */
export type ProfileFeaturedProjectsProps = WithClassNames<undefined>

/** Maximum number of project rows to show in the teaser. */
const MAX_TEASER_ITEMS = 3

/**
 * Discriminated union for the merged project list rendered in the teaser.
 * Each variant carries exactly the fields its row renderer needs.
 */
type FeaturedItem =
    | { kind: "pin"; data: QueryUserPinnedProjectItem }
    | { kind: "capstone-verified"; data: QueryUserCapstoneCourseProgress }
    | { kind: "capstone-in-progress"; data: QueryUserCapstoneCourseProgress }

/**
 * "Dự án" teaser on the Overview tab — state-aware priority merge.
 *
 * Priority order (spec §4):
 *   1. Pinned projects (user-curated, explicit `isVerified` flag from server).
 *   2. Verified capstones not already represented by a pin.
 *   3. In-progress capstones as fallback filler.
 *
 * Capped at {@link MAX_TEASER_ITEMS} rows; "Xem tất cả →" always shown when any
 * data exists. Returns null only when there are NO pins AND NO capstones at all so
 * sparse profiles stay clean.
 *
 * Self-contained: reads username from the route context and drives its own SWR
 * (both deduped with ProfilePinned / ProfileCapstone on the same page).
 *
 * @param props - {@link ProfileFeaturedProjectsProps}
 */
export const ProfileFeaturedProjects = ({
    className,
}: ProfileFeaturedProjectsProps) => {
    const t = useTranslations()
    const setTab = useProfileTabStore((state) => state.setTab)
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null

    const { data: pinsData } = useQueryUserPinnedProjectsSwr(userId)
    const { data: capstoneData } = useQueryUserCapstoneProgressSwr(userId)

    const pins = pinsData ?? []
    const capstones = capstoneData ?? []

    // build priority-ordered merged list, capped at MAX_TEASER_ITEMS
    const items: Array<FeaturedItem> = []

    // 1. Pinned projects (user-curated order, already sorted by orderIndex server-side)
    for (const pin of pins) {
        if (items.length >= MAX_TEASER_ITEMS) break
        items.push({ kind: "pin", data: pin })
    }

    // collect course global ids already represented by a pin so we do not double-render
    const pinnedCourseIds = new Set(
        pins
            .filter((p) => p.type === "course")
            .map((p) => p.id),
    )

    // 2. Verified capstones not covered by a pin (all tasks passed)
    const verifiedCapstones = capstones.filter(
        (c) =>
            c.totalTasks > 0 &&
            c.completedTasks === c.totalTasks &&
            !pinnedCourseIds.has(c.courseGlobalId),
    )
    for (const cap of verifiedCapstones) {
        if (items.length >= MAX_TEASER_ITEMS) break
        items.push({ kind: "capstone-verified", data: cap })
    }

    // 3. In-progress capstones as filler (most complete first)
    const inProgressCapstones = capstones
        .filter(
            (c) =>
                !(c.totalTasks > 0 && c.completedTasks === c.totalTasks) &&
                !pinnedCourseIds.has(c.courseGlobalId),
        )
        .sort((a, b) => {
            const ratioA = a.totalTasks > 0 ? a.completedTasks / a.totalTasks : 0
            const ratioB = b.totalTasks > 0 ? b.completedTasks / b.totalTasks : 0
            return ratioB - ratioA
        })
    for (const cap of inProgressCapstones) {
        if (items.length >= MAX_TEASER_ITEMS) break
        items.push({ kind: "capstone-in-progress", data: cap })
    }

    // nothing in either bucket → section is hidden (sparse profiles stay clean)
    if (pins.length === 0 && capstones.length === 0) {
        return null
    }

    const seeAllAction = (
        <Button
            variant="ghost"
            size="sm"
            onPress={() => setTab("projects")}
            className="h-auto min-w-0 px-0 py-0 text-accent"
        >
            {t("publicProfile.featured.seeAll")}
        </Button>
    )

    return (
        <SectionCard
            className={cn(className)}
            icon={<BriefcaseIcon className="size-5 text-accent" />}
            title={t("publicProfile.featured.heading")}
            action={seeAllAction}
        >
            <div className="flex flex-col gap-0">
                {items.map((item, index) => {
                    const divider = index < items.length - 1

                    if (item.kind === "pin") {
                        return (
                            <PinRow
                                key={item.data.id}
                                pin={item.data}
                                divider={divider}
                                t={t}
                            />
                        )
                    }

                    if (item.kind === "capstone-verified") {
                        return (
                            <CapstoneVerifiedRow
                                key={item.data.courseGlobalId}
                                capstone={item.data}
                                divider={divider}
                                t={t}
                            />
                        )
                    }

                    return (
                        <CapstoneInProgressRow
                            key={item.data.courseGlobalId}
                            capstone={item.data}
                            divider={divider}
                            t={t}
                        />
                    )
                })}
            </div>
        </SectionCard>
    )
}

// ---------------------------------------------------------------------------
// Row sub-components — private to this folder (each has one parent)
// ---------------------------------------------------------------------------

/** Translation function shape accepted by row sub-components. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunction = (key: string, values?: Record<string, any>) => string

interface PinRowProps {
    /** Pinned-project item to render. */
    pin: QueryUserPinnedProjectItem
    /** Whether to draw a bottom separator. */
    divider: boolean
    /** Bound translation function. */
    t: TFunction
}

/**
 * Single row for a pinned project. Verified course pins get the success badge
 * (the primary proof signal); external pins show up to three tech-stack chips
 * and an outbound link icon with a minimum 44px touch target.
 */
function PinRow({ pin, divider, t }: PinRowProps) {
    /*
     * Verified badge is the strongest recruiter signal — render it first in meta
     * so the eye lands on it immediately before scanning tech chips or links.
     */
    const meta = pin.isVerified ? (
        <StatusChip
            tone="success"
            icon={<VerifiedIcon className="size-3.5" />}
        >
            {t("pinnedProjects.verified")}
        </StatusChip>
    ) : (pin.techStack ?? []).length > 0 ? (
        <div className="flex items-center gap-2">
            {(pin.techStack ?? []).slice(0, 3).map((tech) => (
                <Chip key={tech} variant="soft" size="sm">
                    <Chip.Label>{tech}</Chip.Label>
                </Chip>
            ))}
        </div>
    ) : undefined

    /*
     * A11y: the link wraps a decorative icon so it needs an aria-label describing
     * the action. A padding wrapper expands the hit area to meet the 44px minimum
     * touch-target requirement without inflating the visual icon size.
     * focus-visible ring provides a keyboard focus indicator.
     */
    const trailing = pin.url ? (
        <a
            href={pin.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("publicProfile.featured.openProject")}
            onClick={(event) => event.stopPropagation()}
            className={cn(
                "flex size-11 items-center justify-center rounded-xl",
                "text-muted transition-colors hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            )}
        >
            <ExternalLinkIcon className="size-5" />
        </a>
    ) : undefined

    return (
        <ListRow
            leading={
                pin.isVerified ? (
                    <RocketIcon className="size-5 text-accent" />
                ) : (
                    <BriefcaseIcon className="size-5 text-muted" />
                )
            }
            title={pin.title ?? t("pinnedProjects.untitled")}
            subtitle={pin.description ?? undefined}
            meta={meta}
            trailing={trailing}
            divider={divider}
        />
    )
}

interface CapstoneVerifiedRowProps {
    /** Fully-completed capstone course progress. */
    capstone: QueryUserCapstoneCourseProgress
    /** Whether to draw a bottom separator. */
    divider: boolean
    /** Bound translation function. */
    t: TFunction
}

/**
 * Single row for a verified capstone (all tasks passed). Shows the roadmap
 * summary subtitle and the "✓ Verified by StarCi" badge — the strongest
 * recruiter signal on the profile.
 */
function CapstoneVerifiedRow({ capstone, divider, t }: CapstoneVerifiedRowProps) {
    const progressSubtitle = t("publicProfile.capstone.roadmapSummary", {
        completedMilestones: capstone.completedMilestones,
        totalMilestones: capstone.totalMilestones,
        completedTasks: capstone.completedTasks,
        totalTasks: capstone.totalTasks,
    })

    return (
        <ListRow
            leading={<RocketIcon className="size-5 text-accent" />}
            title={capstone.courseTitle}
            subtitle={progressSubtitle}
            meta={(
                <StatusChip
                    tone="success"
                    icon={<VerifiedIcon className="size-3.5" />}
                >
                    {t("pinnedProjects.verified")}
                </StatusChip>
            )}
            divider={divider}
        />
    )
}

interface CapstoneInProgressRowProps {
    /** Partially-completed capstone course progress. */
    capstone: QueryUserCapstoneCourseProgress
    /** Whether to draw a bottom separator. */
    divider: boolean
    /** Bound translation function. */
    t: TFunction
}

/**
 * Single row for a capstone still under construction. Uses ListRow for layout
 * consistency; the ProgressMeter is embedded in a compound subtitle node so the
 * row chrome (leading icon, hairline divider, gap rhythm) stays identical across
 * all three row variants. Per spec §2.6 this is explicitly NOT called "nổi bật".
 */
function CapstoneInProgressRow({ capstone, divider, t }: CapstoneInProgressRowProps) {
    const safeTotal = capstone.totalTasks > 0 ? capstone.totalTasks : 1
    const percent = Math.round((capstone.completedTasks / safeTotal) * 100)
    const progressLabel = `${capstone.completedTasks}/${capstone.totalTasks} task · ${percent}%`

    /*
     * Compound subtitle: text hint on the first line, progress bar on the second.
     * Rendered as a flex column so both lines stay under the title at the same
     * left-alignment as the default subtitle slot.
     */
    const compoundSubtitle = (
        <div className="flex flex-col gap-2">
            <Typography type="body-xs" color="muted" truncate>
                {progressLabel}
            </Typography>
            <ProgressMeter
                value={capstone.completedTasks}
                max={safeTotal}
            />
        </div>
    )

    return (
        <ListRow
            leading={<HammerIcon className="size-5 text-muted" />}
            title={capstone.courseTitle}
            subtitle={compoundSubtitle}
            meta={(
                <StatusChip tone="neutral">
                    {t("publicProfile.featured.inBuilding")}
                </StatusChip>
            )}
            divider={divider}
        />
    )
}
