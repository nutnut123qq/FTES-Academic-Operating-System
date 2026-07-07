"use client"

import useSWR from "swr"

/** A connectable third-party service. `key` is a stable slug for i18n + icon lookup. */
export interface Integration {
    id: string
    key: string
    category: "auth" | "developer" | "communication" | "payment" | "ai" | "storage"
    connected: boolean
}

// ponytail: mock BE — no integrations endpoint yet. Deterministic sample list so the
// hub renders a real grid. Same shape a real GraphQL query (integrations()) would
// return; swap the fetcher when the contract lands, hook API stays.
const fetchIntegrationsMock = async (): Promise<Array<Integration>> => [
    { id: "google", key: "google", category: "auth", connected: true },
    { id: "github", key: "github", category: "developer", connected: true },
    { id: "gmail", key: "gmail", category: "communication", connected: false },
    { id: "firebase", key: "firebase", category: "developer", connected: false },
    { id: "paymentGateway", key: "paymentGateway", category: "payment", connected: false },
    { id: "aiProviders", key: "aiProviders", category: "ai", connected: true },
    { id: "cloudStorage", key: "cloudStorage", category: "storage", connected: false },
]

/** Loads connected/available integrations (§23). Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryIntegrationsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["integrations"], () => fetchIntegrationsMock())
    return { integrations: data ?? [], isLoading, error, mutate }
}
