"use client"

import React, { useState } from "react"
import {
    CalendarIcon,
    ChalkboardTeacherIcon,
    ConfettiIcon,
    MapPinIcon,
    TrophyIcon,
    UsersIcon,
    VideoCameraIcon,
    WrenchIcon,
} from "@phosphor-icons/react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryEventsSwr } from "../hooks/useQueryEventsSwr"
import type { Event } from "../hooks/useQueryEventsSwr"

/** Type filter options: "all" + every event type. */
const TYPES: Array<Event["type"] | "all"> = [
    "all",
    "webinar",
    "workshop",
    "hackathon",
    "competition",
    "meetup",
]

/** Icon per event type for the card badge. */
const TYPE_ICON: Record<Event["type"], typeof CalendarIcon> = {
    webinar: VideoCameraIcon,
    workshop: WrenchIcon,
    hackathon: ChalkboardTeacherIcon,
    competition: TrophyIcon,
    meetup: ConfettiIcon,
}

/**
 * Event catalog (§14) — the `/events` list. Mirrors the house catalog archetype
 * (see `SubjectCatalog`): text search + type filter + a grid of event cards linking
 * into each event page. Feature owns data (mock) + filtering; tokens own the look.
 * ponytail: plain search input + hand-rolled cards, mock data.
 */
export const EventCatalog = () => {
    const t = useTranslations("eventSystem")
    const { events } = useQueryEventsSwr()
    const [query, setQuery] = useState("")
    const [type, setType] = useState<Event["type"] | "all">("all")

    const filtered = events.filter((event) => {
        const matchesType = type === "all" || event.type === type
        const matchesQuery =
            query.trim() === "" ||
            `${event.title} ${event.location}`.toLowerCase().includes(query.trim().toLowerCase())
        return matchesType && matchesQuery
    })

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("catalog.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("catalog.subtitle")}
                </Typography>
            </div>

            {/* search + type filter */}
            <div className="flex flex-col gap-3">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("catalog.searchPlaceholder")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
                <div className="flex flex-wrap gap-2">
                    {TYPES.map((option) => (
                        <Button
                            key={option}
                            size="sm"
                            variant={type === option ? "secondary" : "ghost"}
                            onPress={() => setType(option)}
                        >
                            {option === "all" ? t("catalog.all") : t(`types.${option}`)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* event grid */}
            {filtered.length === 0 ? (
                <Typography type="body-sm" color="muted">
                    {t("catalog.empty")}
                </Typography>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((event) => {
                        const TypeIcon = TYPE_ICON[event.type]
                        return (
                            <div
                                key={event.id}
                                className="flex flex-col gap-3 rounded-2xl border border-separator p-4 transition-colors hover:bg-default/40"
                            >
                                <Link
                                    href={`/events/${event.id}`}
                                    className="flex items-center gap-3 no-underline"
                                >
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                                        <TypeIcon size={22} aria-hidden />
                                    </div>
                                    <div className="min-w-0">
                                        <Typography type="body-sm" weight="medium" truncate>
                                            {event.title}
                                        </Typography>
                                        <Chip size="sm" variant="soft" color="accent" className="mt-1">
                                            {t(`types.${event.type}`)}
                                        </Chip>
                                    </div>
                                </Link>

                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon size={16} className="shrink-0 text-muted" aria-hidden />
                                        <Typography type="body-xs" color="muted" className="truncate">
                                            {event.date}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPinIcon size={16} className="shrink-0 text-muted" aria-hidden />
                                        <Typography type="body-xs" color="muted" className="truncate">
                                            {event.location}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UsersIcon size={16} className="shrink-0 text-muted" aria-hidden />
                                        <Typography type="body-xs" color="muted">
                                            {t("attendeesCount", { count: event.attendees })}
                                        </Typography>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="mt-auto self-start"
                                    // ponytail: mock CTA — no enrol/register endpoint yet.
                                    onPress={() => {}}
                                >
                                    {t("register")}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
