"use client"

import useSWR from "swr"

/** Notification kinds (§15) — each drives an icon + i18n type label. */
export type NotificationType =
    | "mention"
    | "course"
    | "event"
    | "deadline"
    | "challenge"
    | "coin"
    | "group"

/** One notification-center row. `time` is a relative label string (mock). */
export interface NotificationItem {
    id: string
    type: NotificationType
    text: string
    time: string
    read: boolean
}

// ponytail: mock BE — no notifications endpoint yet. Deterministic sample feed,
// same shape the real query will return so NotificationCenter never re-shapes.
// Wire a real GraphQL query (notifications()) when the contract lands; hook API stays.
const fetchNotificationsMock = async (): Promise<Array<NotificationItem>> => [
    { id: "n1", type: "mention", text: "Trần Thị B đã nhắc đến bạn trong thảo luận CSD201.", time: "5 phút trước", read: false },
    { id: "n2", type: "deadline", text: "Đồ án SWP391 hết hạn nộp trong 2 giờ nữa.", time: "1 giờ trước", read: false },
    { id: "n3", type: "course", text: "Bài giảng mới \"Con trỏ trong C\" đã được thêm vào PRF192.", time: "3 giờ trước", read: false },
    { id: "n4", type: "challenge", text: "Bạn hoàn thành thử thách \"Đảo ngược danh sách liên kết\".", time: "Hôm qua", read: true },
    { id: "n5", type: "coin", text: "Bạn nhận được 50 xu học tập cho chuỗi 7 ngày.", time: "Hôm qua", read: false },
    { id: "n6", type: "event", text: "Buổi seminar \"Lộ trình Backend\" bắt đầu lúc 19:00 hôm nay.", time: "2 ngày trước", read: true },
    { id: "n7", type: "group", text: "Nhóm \"CLB Lập trình\" đã đăng thông báo mới.", time: "3 ngày trước", read: true },
    { id: "n8", type: "course", text: "Điểm quiz DBI202 của bạn đã được cập nhật: 9.0/10.", time: "5 ngày trước", read: true },
]

/** Loads the notification feed (§15). Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryNotificationsSwr = () => {
    const { data, isLoading, error } = useSWR(["notifications"], () => fetchNotificationsMock())
    return { notifications: data ?? [], isLoading, error }
}
