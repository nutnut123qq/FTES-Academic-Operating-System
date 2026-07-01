"use client"

import useSWR from "swr"

/** A moderation report (§6, mock until BE lands). */
export interface ModerationReport {
    id: string
    target: string
    reason: string
    reporter: string
}

// ponytail: mock BE — no moderation endpoint yet. Deterministic sample.
const fetchReportsMock = async (): Promise<Array<ModerationReport>> => [
    { id: "r1", target: "Bài: “Bán tài khoản khóa học”", reason: "Spam / quảng cáo", reporter: "Minh" },
    { id: "r2", target: "Bình luận trong “Hỏi đồ án”", reason: "Ngôn từ không phù hợp", reporter: "An" },
    { id: "r3", target: "Bài: “Link tải lậu”", reason: "Vi phạm bản quyền", reporter: "Hoa" },
]

/** Loads the moderation queue. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryReportsSwr = () => {
    const { data, isLoading, error } = useSWR(["reports"], () => fetchReportsMock())
    return { reports: data ?? [], isLoading, error }
}
