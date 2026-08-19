"use client"

import { useMemo } from "react"
import useSWR from "swr"
import {
    getEvents,
    type EventRegistrationView,
    type EventView,
} from "@/modules/api/rest/event"
import { useGetMyEventRegistrationsSwr } from "@/hooks/swr/api/rest/queries/useGetMyEventRegistrationsSwr"

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
    /**
     * BE lifecycle status, uppercased (`DRAFT`/`PUBLISHED`/`ONGOING`/`ENDED`/`CANCELLED`),
     * or `null` when absent. Drives the "đã kết thúc" / "đã huỷ" card state so a past event
     * never shows a live Register CTA.
     */
    status: string | null
    /**
     * Event END time in epoch ms, or `null` when the BE omits/gives an invalid value. Used as
     * a fallback "đã kết thúc" signal for when the server-side scheduler hasn't flipped the
     * status to `ENDED` yet (the end time is already in the past).
     */
    endAtMs: number | null
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

/** Parse an ISO instant to epoch ms; `null` when absent or unparseable. */
const toEpochMs = (iso: string | null | undefined): number | null => {
    if (!iso) return null
    const parsed = new Date(iso)
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
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
    status: view.status ? view.status.toUpperCase() : null,
    endAtMs: toEpochMs(view.endAt),
    locationType: toLocationType(view.locationType),
    attendees: toAttendees(view.capacity, view.seatsLeft),
    registrationStatus: view.myRegistrationStatus ?? null,
})

/**
 * Fill in each card's `registrationStatus` from the viewer's OWN registrations.
 *
 * A status already on the card (i.e. the backend actually resolved one) always wins — this
 * only fills the `null`s the list endpoint leaves behind. Exported for the unit test.
 *
 * @param events - catalog cards mapped from the list endpoint.
 * @param registrations - rows from `GET /event/registrations/me` (empty for a guest).
 * @returns the same cards with `registrationStatus` filled where it was missing.
 */
export const withMyRegistrationStatus = (
    events: Array<Event>,
    registrations: Array<EventRegistrationView>,
): Array<Event> => {
    if (registrations.length === 0) {
        return events
    }
    const mine = new Map(registrations.map((row) => [row.eventId, row.status]))
    return events.map((event) =>
        event.registrationStatus
            ? event
            : { ...event, registrationStatus: mine.get(event.eventId) ?? null },
    )
}

/**
 * Khoá SWR của danh mục sự kiện. Mọi cache của module sự kiện dùng chung tiền tố `events`
 * (danh mục · rail "sắp tới" · chi tiết) để `useMutateEventRegistrationSwr` revalidate 1 lượt.
 */
export const eventsSwrKey = ["events"]

/**
 * Loads the public event catalog from `GET /api/v1/events` (REST) and maps each
 * {@link EventView} to the card {@link Event}. SWR-shaped; renders clean on an empty list.
 *
 * **Trạng thái đăng ký được ghép từ `GET /event/registrations/me`** (góp ý #18). Endpoint
 * DANH SÁCH của backend dựng view bằng `toView(e, null)` — nghĩa là `myRegistrationStatus`
 * LUÔN null cho mọi sự kiện, chỉ endpoint CHI TIẾT mới phân giải trạng thái thật. Vì vậy
 * thẻ nào cũng hiện "Đăng ký" dù người dùng đã có chỗ, bấm vào thì backend trả lỗi trùng.
 * Danh sách đăng ký của chính mình là dữ liệu ĐÃ CÓ endpoint, nên ghép ở đây sửa được
 * ngay mà không phải chờ backend.
 *
 * Trường của backend vẫn được ưu tiên: hôm nào `list()` trả trạng thái thật thì nó thắng,
 * và chỗ ghép này lặng lẽ thành thừa thay vì chọi nhau.
 */
export const useQueryEventsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(eventsSwrKey, getEvents)
    const { data: myRegistrations } = useGetMyEventRegistrationsSwr()

    const events = useMemo(
        () => withMyRegistrationStatus((data ?? []).map(toEvent), myRegistrations ?? []),
        [data, myRegistrations],
    )

    return { events, isLoading, error, mutate }
}
