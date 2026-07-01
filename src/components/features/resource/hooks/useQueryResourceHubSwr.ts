"use client"

import useSWR from "swr"

/** Resource type (§5). */
export type ResourceType = "pdf" | "slide" | "video" | "pe" | "fe" | "source" | "notes"

/** A resource in the global hub (mock until BE lands). */
export interface HubResource {
    id: string
    title: string
    type: ResourceType
    subject: string
    sizeLabel: string
}

// ponytail: mock BE — no resource endpoint yet. Deterministic sample.
const fetchResourceHubMock = async (): Promise<Array<HubResource>> => [
    { id: "h1", title: "Giáo trình PRF192", type: "pdf", subject: "PRF192", sizeLabel: "8.4 MB" },
    { id: "h2", title: "Slide CSD201 — Cây nhị phân", type: "slide", subject: "CSD201", sizeLabel: "2.1 MB" },
    { id: "h3", title: "Đề PE mẫu DBI202", type: "pe", subject: "DBI202", sizeLabel: "540 KB" },
    { id: "h4", title: "Video ôn tập mạng", type: "video", subject: "NET1704", sizeLabel: "210 MB" },
    { id: "h5", title: "Source code Java Web", type: "source", subject: "PRJ301", sizeLabel: "1.3 MB" },
    { id: "h6", title: "Ghi chú giải thuật", type: "notes", subject: "CSD201", sizeLabel: "88 KB" },
]

/** Loads the global resource hub. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryResourceHubSwr = () => {
    const { data, isLoading, error } = useSWR(["resource-hub"], () => fetchResourceHubMock())
    return { resources: data ?? [], isLoading, error }
}
