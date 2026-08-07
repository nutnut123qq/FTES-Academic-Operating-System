"use client"

import useSWR from "swr"
import { getEvents, type EventView } from "@/modules/api/rest/event"

/** Event kind — the BE `event.events.type` CHECK set, lowercased to a label key. */
export type EventType = "webinar" | "workshop" | "hackathon" | "competition" | "meetup"

/** Location modality — the BE `location_type` CHECK set (`ONSITE|ONLINE|HYBRID`), lowercased. */
export type EventLocationType = "onsite" | "online" | "hybrid"

/** A catalog event's identity + logistics, mapped from the BE {@link EventView}. */
export interface Event {
    /** Slug — the card's route id + React key (the BE detail endpoint keys on slug, not the uuid). */
    id: string
    /** UUID thật — endpoint đăng ký (`POST /event/events/{id}/registrations`) key theo uuid, không phải slug. */
    eventId: string
    /** Event title. */
    title: string
    /** Event kind — label key suffix. */
    type: EventType
    /** Formatted start date+time, or `null` when the BE omits it (row hidden). */
    date: string | null
    /** Location modality; `null` when the BE omits it. Nơi diễn ra chỉ hiện ở trang chi tiết. */
    locationType: EventLocationType | null
    /** Confirmed attendee count (`capacity − seatsLeft`); `null` when capacity is unbounded (row hidden). */
    attendees: number | null
    /**
     * Trạng thái đăng ký của người xem (`REGISTERED`/`WAITLISTED`/`CANCELLED`…), `null` khi
     * là khách hoặc DTO danh sách không kèm trường này — nút CTA khi đó cứ hiện "Đăng ký".
     */
    registrationStatus: string | null
}

const KNOWN_TYPES: ReadonlySet<string> = new Set<EventType>([
    "webinar",
    "workshop",
    "hackathon",
    "competition",
    "meetup",
])
const KNOWN_LOCATIONS: ReadonlySet<string> = new Set<EventLocationType>([
    "onsite",
    "online",
    "hybrid",
])

/**
 * Normalise the BE uppercase `type` into a label key. The DB CHECK constrains it to the
 * five known kinds; the fallback only guards an impossible unseen value from crashing the card.
 */
export const toEventType = (raw: string): EventType => {
    const lower = (raw ?? "").toLowerCase()
    return (KNOWN_TYPES.has(lower) ? lower : "webinar") as EventType
}

/** Normalise the BE uppercase `location_type`; `null` khi BE bỏ trống hoặc trả giá trị lạ. */
export const toLocationType = (raw: string | null | undefined): EventLocationType | null => {
    const lower = raw?.toLowerCase()
    return lower && KNOWN_LOCATIONS.has(lower) ? (lower as EventLocationType) : null
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
})

const toEventDate = (iso: string | null | undefined): string | null => {
    if (!iso) return null
    const parsed = new Date(iso)
    return Number.isNaN(parsed.getTime()) ? null : dateFormatter.format(parsed)
}

/** Confirmed registrations = `capacity − seatsLeft`; only known when capacity is bounded. */
const toAttendees = (capacity?: number, seatsLeft?: number): number | null => {
    if (capacity == null || seatsLeft == null) return null
    return Math.max(0, capacity - seatsLeft)
}

/** Map one BE {@link EventView} to the card model, degrading the fields the list DTO omits. */
const toEvent = (view: EventView): Event => ({
    id: view.slug,
    eventId: view.id,
    title: view.title,
    type: toEventType(view.type),
    date: toEventDate(view.startAt),
    locationType: toLocationType(view.locationType),
    attendees: toAttendees(view.capacity, view.seatsLeft),
    registrationStatus: view.myRegistrationStatus ?? null,
})

/**
 * Khoá SWR của danh mục sự kiện. Mọi cache của module sự kiện dùng chung tiền tố `events`
 * (danh mục · rail "sắp tới" · chi tiết) để `useMutateEventRegistrationSwr` revalidate 1 lượt.
 */
export const eventsSwrKey = ["events"]

/**
 * Loads the public event catalog from `GET /api/v1/events` (REST) and maps each
 * {@link EventView} to the card {@link Event}. SWR-shaped; renders clean on an empty list.
 */
export const useQueryEventsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(eventsSwrKey, getEvents)
    const events = (data ?? []).map(toEvent)
    return { events, isLoading, error, mutate }
}
