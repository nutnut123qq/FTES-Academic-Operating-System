"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"
import { cancelEventRegistration, registerEvent } from "@/modules/api/rest/event"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { MY_EVENT_REGISTRATIONS_SWR_KEY } from "@/hooks/swr/api/rest/queries/useGetMyEventRegistrationsSwr"

/** Mọi cache của module sự kiện nằm dưới tiền tố `events` (danh mục · rail sắp tới · chi tiết). */
const matchesEventKey = (key: unknown): boolean =>
    Array.isArray(key)
    && (key[0] === "events"
        // Danh mục suy trạng thái "đã đăng ký" từ CHÍNH cache này (xem
        // `useQueryEventsSwr`), nên nó phải được làm mới cùng lượt — không thì vừa đăng ký
        // xong nút vẫn đứng nguyên chữ "Đăng ký" cho tới lần tải trang sau.
        || key[0] === MY_EVENT_REGISTRATIONS_SWR_KEY)

/**
 * Kết quả 1 lượt bấm: `unauthenticated` = khách (modal đăng nhập đã mở, KHÔNG phải lỗi nên
 * caller đừng báo đỏ), `failed` = BE từ chối hoặc mạng hỏng.
 */
export type EventRegistrationResult = "ok" | "unauthenticated" | "failed"

/**
 * Đăng ký / huỷ đăng ký sự kiện — dùng chung cho card ở `EventCatalog` và trang chi tiết
 * `EventDetail`, nên chỗ nào cũng chung một luật auth-gate, một luật revalidate.
 *
 * Ghi thật qua REST (`POST|DELETE /event/events/{id}/registrations…`, id là UUID chứ không
 * phải slug), rồi revalidate MỌI cache `events` để `seatsLeft` + `myRegistrationStatus` lấy
 * lại từ server (không đoán tại chỗ — số chỗ còn là sự thật của BE, có cả waitlist).
 *
 * @returns `{ submit, isPending }` — `submit(eventId, action)` trả {@link EventRegistrationResult}.
 */
export const useMutateEventRegistrationSwr = () => {
    const { requireAuth } = useRequireAuth()
    const { mutate } = useSWRConfig()
    const [isPending, setPending] = useState(false)

    const submit = useCallback(
        async (
            eventId: string,
            action: "register" | "cancel",
        ): Promise<EventRegistrationResult> => {
            if (!requireAuth("auth.context.eventRegister")) {
                return "unauthenticated"
            }
            setPending(true)
            try {
                if (action === "register") {
                    await registerEvent(eventId)
                } else {
                    await cancelEventRegistration(eventId)
                }
                await mutate(matchesEventKey)
                return "ok"
            } catch {
                return "failed"
            } finally {
                setPending(false)
            }
        },
        [requireAuth, mutate],
    )

    return { submit, isPending }
}
