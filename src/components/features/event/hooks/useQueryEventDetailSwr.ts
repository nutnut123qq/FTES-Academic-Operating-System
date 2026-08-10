"use client"

import useSWR from "swr"
import { getEventDetail, type EventView } from "@/modules/api/rest/event"

/** Khoá SWR chi tiết 1 sự kiện — cùng tiền tố `events` với danh mục và rail "sắp tới". */
export const eventDetailSwrKey = (slug: string) => ["events", "detail", slug]

/**
 * Nạp chi tiết sự kiện từ `GET /api/v1/event/events/{slug}` (endpoint key theo SLUG, không
 * phải uuid). Endpoint public nên khách vẫn đọc được; `restRequest` mặc định đính bearer khi
 * có token nên người đã đăng nhập nhận thêm `myRegistrationStatus`.
 *
 * @param slug - slug sự kiện lấy từ route.
 * @returns `{ event, isLoading, error, mutate }` — `event` là {@link EventView} thô của BE.
 */
export const useQueryEventDetailSwr = (slug: string) => {
    const { data, isLoading, error, mutate } = useSWR<EventView, Error>(
        slug ? eventDetailSwrKey(slug) : null,
        () => getEventDetail(slug),
    )
    return { event: data, isLoading, error, mutate }
}
