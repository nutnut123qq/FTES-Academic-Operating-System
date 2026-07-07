"use client"

import useSWR from "swr"

/** A stage in the content workflow pipeline (§19). Ordered Draft → … → Archived. */
export type WorkflowStage = "draft" | "aiReview" | "modReview" | "approved" | "published" | "archived"

/** The kind of content moving through the workflow. */
export type WorkflowContentType = "resource" | "course" | "forum" | "challenge" | "event"

/** One content item on the workflow board. */
export interface WorkflowItem {
    id: string
    title: string
    contentType: WorkflowContentType
    stage: WorkflowStage
}

// ponytail: mock BE — no workflow endpoint yet. Deterministic sample list, SWR-shaped
// so the board can swap to a real GraphQL query (workflowItems()) without touching the
// component. Hook API (items/isLoading/error) stays when the contract lands.
const fetchWorkflowMock = async (): Promise<Array<WorkflowItem>> => [
    { id: "wf-01", title: "Intro to Data Structures", contentType: "course", stage: "draft" },
    { id: "wf-02", title: "Nginx Reverse Proxy Cheatsheet", contentType: "resource", stage: "draft" },
    { id: "wf-03", title: "Weekly Kafka Discussion Thread", contentType: "forum", stage: "aiReview" },
    { id: "wf-04", title: "Binary Search Challenge Pack", contentType: "challenge", stage: "aiReview" },
    { id: "wf-05", title: "React Hooks Deep Dive", contentType: "course", stage: "modReview" },
    { id: "wf-06", title: "SQL Indexing Workshop", contentType: "event", stage: "modReview" },
    { id: "wf-07", title: "Clean Code Reading List", contentType: "resource", stage: "approved" },
    { id: "wf-08", title: "Docker Fundamentals", contentType: "course", stage: "published" },
]

/** Loads the content-workflow board items (§19). Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryWorkflowSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["workflow"], () => fetchWorkflowMock())
    return { items: data ?? [], isLoading, error, mutate }
}
