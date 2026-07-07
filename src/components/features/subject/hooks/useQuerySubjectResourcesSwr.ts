"use client"

import useSWR from "swr"

/** Resource type — mirrors §5 Resource Hub types. */
export type ResourceType = "pdf" | "slide" | "video" | "pe" | "fe" | "source" | "notes"

/** A single resource in a subject's Resource tab (mock shape until BE lands). */
export interface SubjectResource {
    id: string
    title: string
    type: ResourceType
    /** Human size label, e.g. "2.4 MB". */
    sizeLabel: string
    /** Human updated label, e.g. "3 ngày trước". */
    updatedLabel: string
}

/** A grouping of resources (§5 Collections / Learning Pack). */
export interface SubjectCollection {
    id: string
    title: string
    count: number
}

// ponytail: mock BE — no resource endpoint yet. Deterministic sample so the tab
// renders. Wire subjects(id).resources when the contract exists; hook API stays.
const fetchResourcesMock = async (): Promise<{
    resources: Array<SubjectResource>
    collections: Array<SubjectCollection>
}> => ({
    resources: [
        { id: "r1", title: "Slide chương 1 — Nhập môn C", type: "slide", sizeLabel: "1.2 MB", updatedLabel: "2 ngày trước" },
        { id: "r2", title: "Giáo trình PRF192 (bản đầy đủ)", type: "pdf", sizeLabel: "8.4 MB", updatedLabel: "1 tuần trước" },
        { id: "r3", title: "Đề thi thực hành mẫu (PE)", type: "pe", sizeLabel: "540 KB", updatedLabel: "3 ngày trước" },
        { id: "r4", title: "Đề thi cuối kỳ mẫu (FE)", type: "fe", sizeLabel: "620 KB", updatedLabel: "3 ngày trước" },
        { id: "r5", title: "Source code bài giảng buổi 5", type: "source", sizeLabel: "310 KB", updatedLabel: "5 ngày trước" },
        { id: "r6", title: "Video ôn tập con trỏ", type: "video", sizeLabel: "126 MB", updatedLabel: "hôm qua" },
        { id: "r7", title: "Ghi chú nhanh — mảng & chuỗi", type: "notes", sizeLabel: "48 KB", updatedLabel: "hôm nay" },
    ],
    collections: [
        { id: "c1", title: "Learning pack — Ôn thi PE", count: 6 },
        { id: "c2", title: "Bộ tài liệu nhập môn", count: 4 },
    ],
})

/** Loads a subject's resources + collections. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectResourcesSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-resources", subjectId],
        () => fetchResourcesMock(),
    )
    return {
        resources: data?.resources ?? [],
        collections: data?.collections ?? [],
        isLoading,
        error,
        mutate,
    }
}
