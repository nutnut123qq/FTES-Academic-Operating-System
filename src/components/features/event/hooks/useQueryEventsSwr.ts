"use client"

import useSWR from "swr"

/** A catalog event's identity + logistics (mock shape until the BE contract lands). */
export interface Event {
    /** Opaque id from the route (`[eventId]`). */
    id: string
    /** Event title, e.g. "Xây API với NestJS". */
    title: string
    /** Event kind — label key suffix. */
    type: "webinar" | "workshop" | "hackathon" | "competition" | "meetup"
    /** Display date, e.g. "12/07/2026". */
    date: string
    /** Venue or platform, e.g. "Online (Zoom)". */
    location: string
    /** Registered attendee count. */
    attendees: number
}

// ponytail: mock BE — no events endpoint yet. Deterministic sample list, same shape
// the catalog renders against. Wire a real GraphQL query (events()) when the contract
// lands; the hook API stays the same so callers don't change.
const fetchEventsMock = async (): Promise<Array<Event>> => [
    { id: "evt-nestjs-api", title: "Xây REST API với NestJS", type: "webinar", date: "12/07/2026", location: "Online (Zoom)", attendees: 214 },
    { id: "evt-react-workshop", title: "Workshop React Server Components", type: "workshop", date: "19/07/2026", location: "Hà Nội — FTES Lab", attendees: 48 },
    { id: "evt-ai-hackathon", title: "Hackathon AI 48h", type: "hackathon", date: "02/08/2026", location: "TP. HCM — Innovation Hub", attendees: 132 },
    { id: "evt-algo-contest", title: "Đấu trường thuật toán mùa 3", type: "competition", date: "10/08/2026", location: "Online (Codeforces)", attendees: 386 },
    { id: "evt-devs-meetup", title: "Meetup lập trình viên FTES", type: "meetup", date: "24/08/2026", location: "Đà Nẵng — The Hub", attendees: 76 },
    { id: "evt-cloud-webinar", title: "Webinar Kiến trúc Cloud-native", type: "webinar", date: "05/09/2026", location: "Online (YouTube Live)", attendees: 158 },
]

/** Loads the event catalog. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryEventsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["events"], () => fetchEventsMock())
    return { events: data ?? [], isLoading, error, mutate }
}
