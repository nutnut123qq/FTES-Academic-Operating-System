"use client"

import useSWR from "swr"

/** A contributor's reputation summary (§6, mock until BE lands). */
export interface Contributor {
    id: string
    name: string
    upvotes: number
    downvotes: number
    accepted: number
}

// ponytail: mock BE — no reputation endpoint yet. Deterministic sample.
const fetchContributorsMock = async (): Promise<Array<Contributor>> => [
    { id: "u1", name: "Hoa Lê", upvotes: 320, downvotes: 8, accepted: 24 },
    { id: "u2", name: "Minh Trần", upvotes: 210, downvotes: 5, accepted: 18 },
    { id: "u3", name: "Đức Phạm", upvotes: 140, downvotes: 12, accepted: 9 },
    { id: "u4", name: "An Nguyễn", upvotes: 96, downvotes: 3, accepted: 6 },
]

/** Loads top contributors by reputation. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryContributorsSwr = () => {
    const { data, isLoading, error } = useSWR(["contributors"], () => fetchContributorsMock())
    return { contributors: data ?? [], isLoading, error }
}
