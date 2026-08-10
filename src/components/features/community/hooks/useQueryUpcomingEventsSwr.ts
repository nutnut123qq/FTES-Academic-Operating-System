"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { dayjs } from "@/modules/dayjs"
import { getEvents, type EventView } from "@/modules/api/rest/event"
import {
    toEventType,
    toLocationType,
    type EventLocationType,
    type EventType,
} from "@/components/features/event/hooks/useQueryEventsSwr"

/** Rail chỉ có chỗ cho 3 dòng — phần còn lại đi qua "Xem tất cả". */
const RAIL_LIMIT = 3

/** Trạng thái BE được coi là "sắp tới": DRAFT/ENDED/CANCELLED không lên rail. */
const UPCOMING_STATUSES: ReadonlySet<string> = new Set(["PUBLISHED", "ONGOING"])

/** Một sự kiện sắp tới trên rail cộng đồng, map từ BE {@link EventView}. */
export interface UpcomingEvent {
    /** Slug — vừa là React key vừa là route `/events/{slug}`. */
    id: string
    /** Tiêu đề sự kiện. */
    title: string
    /** Loại sự kiện — dùng tra icon + nhãn `eventSystem.types.*`. */
    type: EventType
    /** Hình thức tổ chức; `null` khi BE bỏ trống (chip ẩn). */
    locationType: EventLocationType | null
    /**
     * Khoá i18n `eventSystem.dayLabels.*` khi sự kiện rơi vào hôm nay/ngày mai; `null` thì
     * dòng ngày dùng {@link dateLabel}. Nhãn nằm ở catalog i18n chứ không hard-code trong hook.
     */
    dayKey: "today" | "tomorrow" | null
    /** Giờ bắt đầu `HH:mm` theo locale — ghép sau {@link dayKey}. */
    timeLabel: string
    /** Nhãn đầy đủ thứ + ngày + giờ theo locale, dùng khi {@link dayKey} là `null`. */
    dateLabel: string
}

/** Nhãn ngày đầy đủ theo locale ("T6, 05/07 19:00" / "Fri, 07/05, 07:00 PM"). */
const formatFullDate = (date: Date, locale: string): string =>
    new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)

/** Chỉ giờ bắt đầu, theo locale — đi kèm nhãn "Hôm nay"/"Ngày mai". */
const formatTime = (date: Date, locale: string): string =>
    new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date)

/** Map 1 {@link EventView} sang dòng rail, gom ngày thành hôm nay / ngày mai / thứ + ngày. */
const toUpcomingEvent = (view: EventView, locale: string): UpcomingEvent => {
    const start = dayjs(view.startAt)
    const now = dayjs()
    const dayKey = start.isSame(now, "day")
        ? "today"
        : start.isSame(now.add(1, "day"), "day")
            ? "tomorrow"
            : null
    const startDate = start.toDate()

    return {
        id: view.slug,
        title: view.title,
        type: toEventType(view.type),
        locationType: toLocationType(view.locationType),
        dayKey,
        timeLabel: formatTime(startDate, locale),
        dateLabel: formatFullDate(startDate, locale),
    }
}

/** Khoá SWR của rail — locale nằm TRONG key vì các nhãn ngày đã format theo locale. */
export const upcomingEventsSwrKey = (locale: string) => ["events", "upcoming", locale]

/**
 * Ba sự kiện gần nhất còn chưa diễn ra, cho rail khám phá của cộng đồng. Đọc lại chính
 * `GET /api/v1/events` của catalog rồi lọc `startAt` còn ở tương lai + trạng thái
 * {@link UPCOMING_STATUSES}, sắp tăng dần theo giờ bắt đầu và cắt {@link RAIL_LIMIT} dòng.
 */
export const useQueryUpcomingEventsSwr = () => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        upcomingEventsSwrKey(locale),
        async (): Promise<Array<UpcomingEvent>> => {
            const items = await getEvents()
            const now = Date.now()
            return (items ?? [])
                .filter(
                    (view) =>
                        UPCOMING_STATUSES.has((view.status ?? "").toUpperCase()) &&
                        // NaN (startAt rỗng/hỏng) luôn so sánh false → dòng đó rụng, đúng ý.
                        new Date(view.startAt).getTime() > now,
                )
                .sort(
                    (left, right) =>
                        new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
                )
                .slice(0, RAIL_LIMIT)
                .map((view) => toUpcomingEvent(view, locale))
        },
    )
    return { events: data ?? [], isLoading, error, mutate }
}
