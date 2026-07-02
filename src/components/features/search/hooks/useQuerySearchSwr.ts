"use client"

import useSWR from "swr"

/** A single search hit — minimal shape for a result row. */
export interface SearchHit {
    id: string
    title: string
    subtitle: string
}

/** Grouped search results, one small list per category (§16 Search Platform). */
export interface SearchResultGroups {
    users: Array<SearchHit>
    subjects: Array<SearchHit>
    courses: Array<SearchHit>
    resources: Array<SearchHit>
    posts: Array<SearchHit>
}

const EMPTY_GROUPS: SearchResultGroups = {
    users: [],
    subjects: [],
    courses: [],
    resources: [],
    posts: [],
}

// ponytail: mock BE — no global-search endpoint yet. Returns the SAME deterministic
// grouped sample for any non-empty query (empty query → empty groups), same shape a
// real `search(query)` GraphQL op would return. Wire the real query when the contract
// lands; the hook API (keyed by query) stays.
const fetchSearchMock = async (query: string): Promise<SearchResultGroups> => {
    if (query.trim() === "") return EMPTY_GROUPS
    return {
        users: [
            { id: "u1", title: "Nguyễn Văn A", subtitle: "@nguyenvana · Sinh viên K18" },
            { id: "u2", title: "Trần Thị B", subtitle: "@tranthib · Giảng viên" },
        ],
        subjects: [
            { id: "prf192", title: "PRF192 — Lập trình C", subtitle: "3 tín chỉ · Cơ bản" },
            { id: "csd201", title: "CSD201 — Cấu trúc dữ liệu & Giải thuật", subtitle: "3 tín chỉ · Trung cấp" },
        ],
        courses: [
            { id: "c1", title: "Nền tảng Web Frontend", subtitle: "12 bài học · 8 giờ" },
            { id: "c2", title: "Thuật toán phỏng vấn", subtitle: "20 bài học · 15 giờ" },
        ],
        resources: [
            { id: "r1", title: "Cheat sheet: Big-O", subtitle: "PDF · 2 trang" },
            { id: "r2", title: "Template báo cáo đồ án", subtitle: "DOCX · Mẫu" },
        ],
        posts: [
            { id: "p1", title: "Cách ôn thi cuối kỳ hiệu quả", subtitle: "Cộng đồng · 42 lượt thích" },
            { id: "p2", title: "Chia sẻ lộ trình học Backend", subtitle: "Cộng đồng · 18 bình luận" },
        ],
    }
}

/** Global search (§16). Mocked; SWR-shaped + keyed by query for a drop-in BE swap. */
export const useQuerySearchSwr = (query: string) => {
    const { data, isLoading, error } = useSWR(["search", query], () => fetchSearchMock(query))
    return { groups: data ?? EMPTY_GROUPS, isLoading, error }
}
