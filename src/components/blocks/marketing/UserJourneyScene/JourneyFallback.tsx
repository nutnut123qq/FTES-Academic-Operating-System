import React from "react"
import {
    HouseIcon,
    BriefcaseIcon,
    BookOpenIcon,
    BarbellIcon,
    TrophyIcon,
    ArrowRightIcon,
    type Icon,
} from "@phosphor-icons/react"
import { cn, Typography } from "@heroui/react"
import type { JourneyStationLabel } from "./types"

/** Icon per station id — the static (non-WebGL) journey uses phosphor glyphs. */
const STATION_ICON: Record<string, Icon> = {
    home: HouseIcon,
    workplace: BriefcaseIcon,
    course: BookOpenIcon,
    practice: BarbellIcon,
    outcome: TrophyIcon,
}

/** Props for {@link JourneyFallback}. */
export interface JourneyFallbackProps {
    /** Ordered station copy (id / label / caption) — same five as the 3D scene. */
    labels: JourneyStationLabel[]
    /** Highlighted station index (mirrors the stepper). */
    activeIndex?: number
    className?: string
}

/**
 * Static, crawlable journey illustration — the guaranteed baseline shown for reduced
 * motion, `<lg` viewports, WebGL failure, and while the three.js chunk loads (so the
 * scene slot never collapses / shifts). Renders the SAME five stations as the 3D
 * scene, as a horizontal (desktop) / vertical (mobile) path of labelled icon nodes
 * with connecting arrows, ending in the emphasized "Thành quả" payoff. All labels and
 * captions are real DOM text (SEO + screen readers never depend on WebGL).
 *
 * @param props - {@link JourneyFallbackProps}
 */
export const JourneyFallback = ({ labels, activeIndex = 0, className }: JourneyFallbackProps) => {
    return (
        <ol
            className={cn(
                "flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between",
                className,
            )}
        >
            {labels.map((station, i) => {
                const StationIcon = STATION_ICON[station.id] ?? BookOpenIcon
                const isPayoff = station.id === "outcome"
                const isActive = i === activeIndex
                return (
                    <React.Fragment key={station.id}>
                        <li className="flex flex-1 flex-row items-center gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
                            <span
                                className={cn(
                                    "flex size-12 shrink-0 items-center justify-center rounded-large border transition-colors",
                                    isPayoff
                                        ? "border-success bg-success/10 text-success"
                                        : isActive
                                            ? "border-accent bg-accent/10 text-accent"
                                            : "border-separator bg-default/40 text-muted",
                                )}
                            >
                                <StationIcon className="size-6" aria-hidden focusable="false" />
                            </span>
                            <div className="flex flex-col gap-0.5 sm:items-center">
                                <Typography
                                    type="body-sm"
                                    weight="bold"
                                    className={cn(isPayoff && "text-success")}
                                >
                                    {station.label}
                                </Typography>
                                <Typography type="body-xs" color="muted" className="max-w-[16rem]">
                                    {station.caption}
                                </Typography>
                            </div>
                        </li>
                        {i < labels.length - 1 ? (
                            <ArrowRightIcon
                                className="mx-auto size-4 rotate-90 shrink-0 self-center text-muted sm:mt-4 sm:rotate-0"
                                aria-hidden
                                focusable="false"
                            />
                        ) : null}
                    </React.Fragment>
                )
            })}
        </ol>
    )
}
