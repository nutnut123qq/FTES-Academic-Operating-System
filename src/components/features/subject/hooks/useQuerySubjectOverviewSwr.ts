"use client"

import useSWR from "swr"

/** Headline counts for the subject-workspace join banner. */
export interface OverviewStats {
    members: number
    moderators: number
    resources: number
}

/** A community post shown on the overview (pinned or recent). */
export interface OverviewPost {
    id: string
    /** Display name of the author. */
    author: string
    /** URL-facing username for profile link + hovercard. */
    authorUsername: string
    timeLabel: string
    title: string
    snippet: string
    reactions: number
    comments: number
}

/** A resource shortcut row. `type` maps to `subjects.resources.types.*`. */
export interface OverviewResource {
    id: string
    title: string
    type: "pdf" | "slide" | "video" | "pe" | "fe" | "source" | "notes"
}

/** Difficulty of a highlighted challenge. */
export type OverviewDifficulty = "easy" | "medium" | "hard"

/** A highlighted challenge shortcut row. */
export interface OverviewChallenge {
    id: string
    title: string
    difficulty: OverviewDifficulty
}

/** An active member (initials avatar). */
export interface OverviewMember {
    id: string
    /** URL-facing username for profile link + hovercard. */
    username: string
    /** Display name shown in the avatar stack. */
    name: string
}

/** The subject-workspace overview payload (§ subject hub, mock until BE lands). */
export interface SubjectOverview {
    stats: OverviewStats
    pinnedPost: OverviewPost | null
    posts: Array<OverviewPost>
    newResources: Array<OverviewResource>
    challenges: Array<OverviewChallenge>
    activeMembers: Array<OverviewMember>
    /** Active members beyond the shown avatars (the "+N" pill). */
    activeOverflow: number
}

// ponytail: mock BE — no subject-overview endpoint yet. One curated payload feeding the
// hub (join banner + feed + resource/challenge/member shortcuts). Swap for a real
// GraphQL query (subjectOverview(subjectId)) when the contract lands; shape stays.
const fetchOverviewMock = async (): Promise<SubjectOverview> => ({
    stats: { members: 342, moderators: 3, resources: 128 },
    pinnedPost: {
        id: "p0",
        author: "Moderator",
        authorUsername: "moderator" /* mock */,
        timeLabel: "hôm nay",
        title: "Đề ôn giữa kỳ + lời giải đã lên",
        snippet: "Tải ở mục Tài liệu, làm thử ở Challenge tuần này.",
        reactions: 42,
        comments: 6,
    },
    posts: [
        {
            id: "p1",
            author: "Hùng",
            authorUsername: "hung-pham" /* mock */,
            timeLabel: "2 giờ trước",
            title: "Cây AVL xoay kép mọi người giải sao?",
            snippet: "Mình rối phần cân bằng sau khi chèn, ai giải thích giúp với.",
            reactions: 12,
            comments: 8,
        },
        {
            id: "p2",
            author: "Lan",
            authorUsername: "lan-tran" /* mock */,
            timeLabel: "hôm qua",
            title: "Chia sẻ note Big-O ôn thi",
            snippet: "Tổng hợp độ phức tạp các thuật toán sắp xếp, có ví dụ.",
            reactions: 20,
            comments: 3,
        },
    ],
    newResources: [
        { id: "r1", title: "Slide chương 4 — Cây", type: "slide" },
        { id: "r2", title: "Bài giải BST.c", type: "source" },
        { id: "r3", title: "Note ôn tập giữa kỳ", type: "notes" },
    ],
    challenges: [
        { id: "c1", title: "Sắp xếp trộn", difficulty: "medium" },
        { id: "c2", title: "Duyệt cây nhị phân", difficulty: "hard" },
    ],
    activeMembers: [
        { id: "m1", username: "hung-pham" /* mock */, name: "Hùng" },
        { id: "m2", username: "lan-tran" /* mock */, name: "Lan" },
        { id: "m3", username: "minh-le" /* mock */, name: "Minh" },
    ],
    activeOverflow: 9,
})

/** Loads the subject-workspace overview. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectOverviewSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-overview", subjectId],
        () => fetchOverviewMock(),
    )
    return { overview: data, isLoading, error, mutate }
}
