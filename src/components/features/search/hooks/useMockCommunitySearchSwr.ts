"use client"

import useSWR from "swr"
import type { Locale } from "next-intl"
import { pathConfig } from "@/resources/path"
import type { SearchMockKind, SearchRow } from "../types"

/**
 * ponytail: MOCK provider — the backend does NOT index community entities yet
 * (users / posts / groups / resources; assumption A1 in the change design). Returns
 * a deterministic, future-BE-shaped sample for any query ≥ the shared min length,
 * mapped into the same {@link SearchRow} model as the real contract. Swap = replace
 * the fetcher internals with the real query once the endpoint lands; the hook API
 * (keyed by query) and the row shape stay.
 */
const fetchMockCommunity = (query: string, locale: Locale): Record<SearchMockKind, Array<SearchRow>> => {
    const path = pathConfig().locale(locale)
    const echo = query.trim()
    return {
        users: [
            { id: "mock-u1", kind: "users", title: `${echo} · Nguyễn Văn A`, snippet: "@nguyenvana", href: path.profile("nguyenvana").build() },
            { id: "mock-u2", kind: "users", title: `${echo} · Trần Thị B`, snippet: "@tranthib", href: path.profile("tranthib").build() },
        ],
        posts: [
            { id: "mock-p1", kind: "posts", title: `Bài viết: ${echo}`, snippet: "Cộng đồng · 42 lượt thích", href: path.community().build() },
        ],
        groups: [
            { id: "mock-g1", kind: "groups", title: `Nhóm: ${echo}`, snippet: "Nhóm học tập · 128 thành viên", href: path.groups().build() },
        ],
        resources: [
            { id: "mock-r1", kind: "resources", title: `Tài nguyên: ${echo}`, snippet: "PDF · 2 trang", href: path.resources().build() },
        ],
    }
}

const EMPTY: Record<SearchMockKind, Array<SearchRow>> = {
    users: [],
    posts: [],
    groups: [],
    resources: [],
}

/**
 * Mock community-search rows (users/posts/groups/resources) shaped like a future BE
 * response. Local-only (no auth, no network) so it renders even for unauthenticated
 * visitors on `/search`. Keyed by the trimmed query for a drop-in real-endpoint swap.
 * @param query - the search query.
 * @param locale - active locale (for href building).
 * @param enabled - whether to produce rows (mirrors the shared min-chars gate).
 * @returns `{ groups }` — one row list per mock category.
 */
export const useMockCommunitySearchSwr = (
    query: string,
    locale: Locale,
    enabled: boolean,
): { groups: Record<SearchMockKind, Array<SearchRow>> } => {
    const trimmed = query.trim()
    const { data } = useSWR(
        enabled && trimmed ? ["MOCK_COMMUNITY_SEARCH", trimmed, locale] : null,
        () => fetchMockCommunity(trimmed, locale),
        { keepPreviousData: true },
    )
    return { groups: data ?? EMPTY }
}
