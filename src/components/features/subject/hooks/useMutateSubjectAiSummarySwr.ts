"use client"

import { submitSummaryJob } from "@/modules/api/rest/ai"
import type { SummaryResult } from "@/components/features/ai-platform/tools/types"

import { useSubjectAiJob } from "./useSubjectAiJob"

/** A generated summary, flattened for the subject Summary surface. */
export interface SubjectAiSummary {
    /** Bulleted key points (worker `key_points`). */
    keyPoints: Array<string>
    /** Short abstract paragraph (worker `tldr`). */
    abstract: string
    /** Glossary entries, when the worker produced any. */
    glossary: Array<{ term: string, definition: string }>
    /** Estimated read minutes, when present. */
    readMinutes?: number
    /** Producing model — always surfaced (every model summarizes differently). */
    model?: string
}

/** Args for a summary run. */
export interface GenerateSubjectSummaryArgs {
    /** Resource UUID picked in the source list (BE `resourceId`). */
    resourceId: string
    /** UI locale forwarded as the generation language. */
    language: string
}

/**
 * Flattens a raw `SUMMARY` job result into {@link SubjectAiSummary}.
 *
 * The worker stores `{tldr, key_points, glossary, estimated_read_min, model}` as a
 * JSON string, already parsed by the poller. A model that answered with bare
 * markdown instead of the wrapper arrives as a plain string — it is kept as the
 * abstract rather than dropped, so a degraded run still shows its content.
 *
 * @param raw - the parsed job result, or undefined before the job COMPLETED.
 * @returns the flattened summary, or undefined when there is nothing to render.
 */
export const mapSummaryJobResult = (
    raw: SummaryResult | string | undefined,
): SubjectAiSummary | undefined => {
    if (raw === undefined || raw === null) return undefined
    if (typeof raw === "string") {
        const text = raw.trim()
        return text ? { keyPoints: [], abstract: text, glossary: [] } : undefined
    }
    const keyPoints = (raw.key_points ?? []).filter(
        (point): point is string => typeof point === "string" && point.trim() !== "",
    )
    const abstract = raw.tldr?.trim() ?? ""
    const glossary = (raw.glossary ?? []).filter((entry) => !!entry?.term)
    if (!keyPoints.length && !abstract && !glossary.length) return undefined
    return {
        keyPoints,
        abstract,
        glossary,
        readMinutes: raw.estimated_read_min,
        model: raw.model,
    }
}

/**
 * Runs the REAL summary job for a picked subject resource: `POST /ai/learning/summary`
 * with `{resourceId, language}` → poll `GET /ai/jobs/{id}` until a terminal status →
 * flatten the worker payload into key points + abstract.
 *
 * A failed re-run keeps the previous summary on screen (the surface renders `data`
 * and `errorKey` side by side) — regenerating never blanks a good result.
 */
export const useMutateSubjectAiSummarySwr = () => {
    const job = useSubjectAiJob<SummaryResult | string>()

    /** Submit a summary job for the picked resource. */
    const generate = (args: GenerateSubjectSummaryArgs) =>
        void job.run(() =>
            submitSummaryJob({
                resourceId: args.resourceId,
                language: args.language,
            }),
        )

    return {
        ...job,
        generate,
        data: mapSummaryJobResult(job.result),
    }
}
