"use client"

import useSWR from "swr"

/** The kinds of activity the engine emits — each maps to an icon + i18n label. */
export type ActivityKind =
    | "courseEnrolled"
    | "lessonCompleted"
    | "resourceUploaded"
    | "questionPosted"
    | "badgeEarned"
    | "coinEarned"
    | "eventJoined"
    | "groupJoined"

/** One row of the user activity timeline. */
export interface ActivityItem {
    id: string
    kind: ActivityKind
    text: string
    /** ISO timestamp; rendered as relative time in the feed. */
    time: string
}

// ponytail: mock BE — the Activity Engine backbone (§18) is a BE service; there is
// no timeline endpoint yet. Deterministic sample feed, SWR-shaped so the FE surface
// is a drop-in swap for the real `activity()` query when the contract lands.
const fetchActivityMock = async (): Promise<Array<ActivityItem>> => [
    { id: "a1", kind: "lessonCompleted", text: "Bài 3: Con trỏ trong C — PRF192", time: "2026-07-02T08:15:00Z" },
    { id: "a2", kind: "questionPosted", text: "Tại sao segmentation fault khi free hai lần?", time: "2026-07-02T06:40:00Z" },
    { id: "a3", kind: "badgeEarned", text: "Streak 7 ngày liên tục", time: "2026-07-01T22:05:00Z" },
    { id: "a4", kind: "resourceUploaded", text: "Slide ôn thi CSD201.pdf", time: "2026-07-01T15:30:00Z" },
    { id: "a5", kind: "coinEarned", text: "+50 xu — hoàn thành quiz Cấu trúc dữ liệu", time: "2026-07-01T11:12:00Z" },
    { id: "a6", kind: "courseEnrolled", text: "Lập trình Java Web — PRJ301", time: "2026-06-30T09:00:00Z" },
    { id: "a7", kind: "eventJoined", text: "Workshop: Clean Code 101", time: "2026-06-29T13:45:00Z" },
    { id: "a8", kind: "groupJoined", text: "Nhóm học Đồ án phần mềm SWP391", time: "2026-06-28T18:20:00Z" },
]

/** Loads the user activity timeline. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryActivitySwr = () => {
    const { data, isLoading, error } = useSWR(["activity"], () => fetchActivityMock())
    return { activity: data ?? [], isLoading, error }
}
