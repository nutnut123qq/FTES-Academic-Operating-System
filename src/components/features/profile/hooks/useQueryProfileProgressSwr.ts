"use client"

import useSWR from "swr"

/** Gamification progress display (§11, mock until BE lands). */
export interface ProfileProgress {
    xp: number
    level: number
    coin: number
    reputation: number
}

// ponytail: mock BE — no gamification endpoint yet. Deterministic sample.
const fetchProgressMock = async (): Promise<ProfileProgress> => ({
    xp: 4820,
    level: 12,
    coin: 350,
    reputation: 187,
})

/** Loads the viewer's progress stats. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryProfileProgressSwr = () => {
    const { data, isLoading, error } = useSWR(["profile-progress", "me"], () => fetchProgressMock())
    return { progress: data, isLoading, error }
}
