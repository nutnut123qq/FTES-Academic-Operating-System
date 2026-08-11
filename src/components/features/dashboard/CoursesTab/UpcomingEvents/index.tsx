"use client"

import React from "react"
import { Chip } from "@heroui/react"
import { CalendarIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard, SurfaceListCardRow } from "@/components/blocks/cards/SurfaceListCard"
import { TYPE_ICON } from "@/components/features/event/typeIcons"
import { useQueryDashboardCoursesEventsSwr } from "../../hooks/useQueryDashboardCoursesEventsSwr"
import type { DashboardUpcomingEvent } from "../../hooks/useQueryDashboardCoursesEventsSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link UpcomingEvents}. */
export type UpcomingEventsProps = WithClassNames<undefined>

/**
 * "Sự kiện sắp tới" — the next few platform events, with the ones the viewer already
 * has a seat at marked.
 *
 * Named after events rather than livestreams on purpose: FTES has no livestream
 * entity, only the `event` module (`WEBINAR | WORKSHOP | HACKATHON | COMPETITION |
 * MEETUP`), so the row leads with the event-type icon and its start time.
 *
 * The "đã đăng ký" mark is joined in the adapter from the viewer's registrations —
 * the list endpoint always returns a null `myRegistrationStatus`.
 *
 * @param props - optional root class name (placement only)
 */
export const UpcomingEvents = ({ className }: UpcomingEventsProps) => {
    const t = useTranslations("eventSystem")
    const tDashboard = useTranslations("dashboard")
    const router = useRouter()
    const { events, isLoading, error, mutate } = useQueryDashboardCoursesEventsSwr()
    const hasEvents = !isLoading && !error && events.length > 0

    /** Today/tomorrow collapse to just the time; anything further keeps weekday + date. */
    const dateLabel = (event: DashboardUpcomingEvent): string =>
        event.dayKey
            ? `${t(`dayLabels.${event.dayKey}`)} · ${event.timeLabel}`
            : event.dateLabel

    return (
        <LabeledCard
            className={className}
            label={tDashboard("upcomingEvents.title")}
            frameless={hasEvents}
        >
            <AsyncContent
                isLoading={isLoading && events.length === 0}
                skeleton={(
                    <SurfaceListCard>
                        {[0, 1, 2].map((row) => (
                            <Skeleton.ListRow key={row} withSubtitle className="px-4" />
                        ))}
                    </SurfaceListCard>
                )}
                isEmpty={events.length === 0}
                emptyContent={{ title: t("upcoming.empty") }}
                error={events.length === 0 ? error : undefined}
                errorContent={{
                    title: t("catalog.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("catalog.retry"),
                }}
            >
                <SurfaceListCard>
                    {events.map((event) => {
                        const TypeIcon = TYPE_ICON[event.type] ?? CalendarIcon
                        return (
                            <SurfaceListCardRow
                                key={event.slug}
                                leading={(
                                    <IconTile
                                        size="sm"
                                        tone="accent"
                                        icon={<TypeIcon aria-hidden focusable="false" />}
                                    />
                                )}
                                title={event.title}
                                subtitle={dateLabel(event)}
                                meta={(
                                    <>
                                        {event.registered ? (
                                            <Chip size="sm" variant="soft" color="success">
                                                {t("registered")}
                                            </Chip>
                                        ) : null}
                                        {event.locationType ? (
                                            <Chip size="sm" variant="soft" color="accent">
                                                {t(`locationTypes.${event.locationType}`)}
                                            </Chip>
                                        ) : null}
                                    </>
                                )}
                                onPress={() => router.push(`/events/${event.slug}`)}
                                hover="underline"
                            />
                        )
                    })}
                </SurfaceListCard>
            </AsyncContent>
        </LabeledCard>
    )
}
