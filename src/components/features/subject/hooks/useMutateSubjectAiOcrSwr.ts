"use client"

import { submitOcrJob } from "@/modules/api/rest/ai"
import {
    uploadLearningFileToStorage,
    validateLearningFile,
    LEARNING_UPLOAD_MAX_BYTES,
    type LearningFileError,
} from "@/components/features/ai-platform/tools/LearningInput/upload"

import { useSubjectAiJob } from "./useSubjectAiJob"

/** Extracted text of a finished OCR job. */
export interface SubjectAiOcrText {
    /** The recognized text (may be long — the surface scrolls it). */
    text: string
    /** Page count reported by ftes-ai-service, when it sent one. */
    pageCount?: number
    /** Producing model. */
    model?: string
}

/** Raw `OCR` job result — `{text, pages, tables, model, document_ref}` (BE `AiJobWorker.ocr`). */
export interface OcrJobResult {
    text?: string
    pages?: unknown
    model?: string
    document_ref?: string
}

// Re-exported so the OCR surface validates a picked file with the SAME gate the
// upload itself uses (BE `FileStorageService.ALLOWED_TYPES` + 10MB cap).
export { validateLearningFile, LEARNING_UPLOAD_MAX_BYTES }
export type { LearningFileError }

/**
 * Maps a raw OCR job result into {@link SubjectAiOcrText}.
 *
 * `pages` arrives either as a number or as an array of per-page blocks depending on
 * the ai-service build, so only a countable shape becomes `pageCount`. A bare string
 * result (worker degraded to plain text) is taken as the text itself.
 *
 * @param raw - the parsed job result, or undefined before the job COMPLETED.
 */
export const mapOcrJobResult = (
    raw: OcrJobResult | string | undefined,
): SubjectAiOcrText | undefined => {
    if (raw === undefined || raw === null) return undefined
    if (typeof raw === "string") {
        const text = raw.trim()
        return text ? { text } : undefined
    }
    const text = (raw.text ?? "").trim()
    if (!text) return undefined
    const pageCount = Array.isArray(raw.pages)
        ? raw.pages.length
        : typeof raw.pages === "number"
            ? raw.pages
            : undefined
    return { text, pageCount, model: raw.model }
}

/**
 * Runs the REAL OCR job for an uploaded image/PDF.
 *
 * OCR is the one learning job that takes NO resource reference: the BE
 * (`JobController.ocr`) accepts only a `storageKey` it can prove the caller owns.
 * So the file goes through the platform presigned pipeline first
 * (`/platform/files/presign-upload` → PUT → `/files/{id}/complete`, reused verbatim
 * from the AI hub) and the returned key is submitted. The upload runs INSIDE the
 * job factory so a presign/PUT failure (e.g. an environment with no object store
 * wired) surfaces as the tool's normal error state instead of an unhandled rejection.
 */
export const useMutateSubjectAiOcrSwr = () => {
    const job = useSubjectAiJob<OcrJobResult | string>()

    /** Upload the picked file, then submit its OCR job. */
    const run = (file: File) =>
        void job.run(async () => {
            const storageKey = await uploadLearningFileToStorage(file)
            return submitOcrJob({ storageKey })
        })

    return {
        ...job,
        run,
        data: mapOcrJobResult(job.result),
    }
}
