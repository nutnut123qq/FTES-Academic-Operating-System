"use client"

import useSWR from "swr"

/** A poll option (§6, mock until BE lands). */
export interface PollOption {
    id: string
    label: string
    votes: number
}

/** A community poll. */
export interface Poll {
    question: string
    options: Array<PollOption>
}

// ponytail: mock BE — no poll endpoint yet. Deterministic sample.
const fetchPollMock = async (): Promise<Poll> => ({
    question: "Bạn thích học ngôn ngữ nào đầu tiên?",
    options: [
        { id: "o1", label: "C", votes: 120 },
        { id: "o2", label: "Python", votes: 260 },
        { id: "o3", label: "JavaScript", votes: 180 },
        { id: "o4", label: "Java", votes: 90 },
    ],
})

/** Loads a community poll. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryPollSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["poll"], () => fetchPollMock())
    return { poll: data, isLoading, error, mutate }
}
