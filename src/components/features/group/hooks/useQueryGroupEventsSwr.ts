"use client"

import useSWR from "swr"

/** A group event (§7/§14, mock until BE lands). */
export interface GroupEvent {
    id: string
    title: string
    dateLabel: string
    attendees: number
}

// ponytail: mock BE — no events endpoint yet. Deterministic sample.
const fetchGroupEventsMock = async (): Promise<Array<GroupEvent>> => [
    { id: "ev1", title: "Workshop: Git & GitHub", dateLabel: "T6, 05/07 · 19:00", attendees: 42 },
    { id: "ev2", title: "Buổi ôn thi PE cùng nhau", dateLabel: "CN, 07/07 · 14:00", attendees: 28 },
    { id: "ev3", title: "Talkshow: Con đường Backend", dateLabel: "T4, 10/07 · 20:00", attendees: 65 },
]

/** Loads a group's events. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupEventsSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(["group-events", groupId], () => fetchGroupEventsMock())
    return { events: data ?? [], isLoading, error }
}
