"use client"

import useSWR from "swr"

/** A group challenge (§7/§10, mock until BE lands). */
export interface GroupChallenge {
    id: string
    title: string
    deadlineLabel: string
    participants: number
}

// ponytail: mock BE — no challenge endpoint yet. Deterministic sample.
const fetchGroupChallengesMock = async (): Promise<Array<GroupChallenge>> => [
    { id: "gc1", title: "Thử thách 30 ngày code mỗi ngày", deadlineLabel: "Còn 12 ngày", participants: 58 },
    { id: "gc2", title: "Giải 50 bài LeetCode Easy", deadlineLabel: "Còn 5 ngày", participants: 34 },
    { id: "gc3", title: "Làm 1 dự án mini cuối tuần", deadlineLabel: "Còn 2 ngày", participants: 21 },
]

/** Loads a group's challenges. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupChallengesSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(["group-challenges", groupId], () => fetchGroupChallengesMock())
    return { challenges: data ?? [], isLoading, error }
}
