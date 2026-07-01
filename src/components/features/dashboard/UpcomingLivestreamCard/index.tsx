"use client"

import React, {
    useMemo,
} from "react"
import {
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    Video as VideoIcon,
} from "@gravity-ui/icons"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyUpcomingLivestreamsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyUpcomingLivestreamsSwr"
import { SectionCard } from "@/components/reuseable/SectionCard"

/** How many upcoming sessions to list (the soonest plus a few more). */
const MAX_ROWS = 3

/** Props for {@link UpcomingLivestreamCard}. */
export type UpcomingLivestreamCardProps = WithClassNames<undefined>

/**
 * Right-rail card surfacing the viewer's next live sessions across enrolled
 * courses (soonest first), so a scheduled stream is visible from the home surface
 * instead of buried in a course page. The soonest session leads with a relative
 * countdown ("in Nd Nh"); a short list of the next few follows. Self-fetches its
 * own leaf query and hides entirely when there is nothing upcoming.
 * @param props - optional className for the root element.
 */
export const UpcomingLivestreamCard = ({
    className,
}: UpcomingLivestreamCardProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { data } = useQueryMyUpcomingLivestreamsSwr()

    /** The soonest few sessions, sorted defensively by start time. */
    const sessions = useMemo(
        () => {
            return [...(data ?? [])]
                .sort(
                    (a, b) => new Date(a.nextStartAt).getTime()
                        - new Date(b.nextStartAt).getTime(),
                )
                .slice(0, MAX_ROWS)
        },
        [
            data,
        ],
    )

    // nothing scheduled (or not loaded yet) → no card
    if (sessions.length === 0) {
        return null
    }

    /**
     * A short relative label until `iso` ("in Nd Nh" / "in Nh Nm" / "now"). Past
     * timestamps collapse to "now" since the list only holds upcoming sessions.
     */
    const relativeLabel = (iso: string) => {
        const remaining = new Date(iso).getTime() - Date.now()
        if (remaining <= 0) {
            return t("dashboard.upcomingLive.now")
        }
        const days = Math.floor(remaining / 86_400_000)
        const hours = Math.floor((remaining % 86_400_000) / 3_600_000)
        const minutes = Math.floor((remaining % 3_600_000) / 60_000)
        if (days > 0) {
            return t("dashboard.upcomingLive.inDays", {
                days,
                hours,
            })
        }
        if (hours > 0) {
            return t("dashboard.upcomingLive.inHours", {
                hours,
                minutes,
            })
        }
        return t("dashboard.upcomingLive.inMinutes", {
            minutes,
        })
    }

    return (
        <SectionCard
            icon={<VideoIcon className="size-5 text-accent" />}
            title={t("dashboard.upcomingLive.title")}
            className={className}
        >
            <div className="flex flex-col gap-1.5">
                {sessions.map((session, index) => (
                    <button
                        key={`${session.courseGlobalId}-${session.nextStartAt}`}
                        type="button"
                        onClick={() => router.push(
                            pathConfig().locale(locale).course(session.courseDisplayId).build(),
                        )}
                        className={cn(
                            "flex flex-col gap-0 rounded-medium px-2 py-1.5 text-left hover:bg-default/60",
                            // the soonest session reads as the headline row
                            index === 0 && "bg-accent/5",
                        )}
                    >
                        <span className="truncate text-sm font-semibold text-foreground">
                            {session.sessionTitle ?? session.courseTitle}
                        </span>
                        <span className="truncate text-xs text-muted">
                            {session.sessionTitle ? session.courseTitle : null}
                        </span>
                        <span className="text-xs font-medium text-accent">
                            {relativeLabel(session.nextStartAt)}
                            {" · "}
                            {new Date(session.nextStartAt).toLocaleDateString(locale)}
                        </span>
                    </button>
                ))}
            </div>
        </SectionCard>
    )
}
