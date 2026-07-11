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
    /** Post the poll belongs to — target of `POST /community/posts/{id}/poll-votes`. */
    postId: string
    question: string
    options: Array<PollOption>
}

// mock BE — the BE has NO poll-read endpoint (neither REST nor the feed/post
// GraphQL exposes poll options), so the poll DATA stays mock. The vote is
// auth-gated but kept LOCAL-only (useMutatePollVoteSwr does NOT call
// `POST /community/posts/{id}/poll-votes` — placeholder UUIDs would 400) until a
// real poll post with genuine UUIDs flows through. Ids stand in for real UUIDs.
const fetchPollMock = async (): Promise<Poll> => ({
    postId: "00000000-0000-0000-0000-0000000000p1",
    question: "Bạn thích học ngôn ngữ nào đầu tiên?",
    options: [
        { id: "o1", label: "C", votes: 120 },
        { id: "o2", label: "Python", votes: 260 },
        { id: "o3", label: "JavaScript", votes: 180 },
        { id: "o4", label: "Java", votes: 90 },
    ],
})

/** Loads a community poll. Data is mocked (no BE poll-read endpoint); the vote is local-only. */
export const useQueryPollSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["poll"], () => fetchPollMock())
    return { poll: data, isLoading, error, mutate }
}
