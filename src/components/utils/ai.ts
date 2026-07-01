import { JobStatus } from "@/modules/types/enums/job-status"
import { JobCategory } from "@/modules/types/enums/job-category"

/**
 * Resolves `aiProcessing.*` title/description for a category + status (same keys as {@link AIProcessingModal}).
 */
export interface AiProcessingCopy {
    /** Short headline from locale. */
    title: string
    /** Supporting line from locale. */
    description: string
    /** Optional failure detail (not translated). */
    error?: string
}

/**
 * Parameters for {@link resolveAiProcessingCopy}.
 */
export interface ResolveAiProcessingCopyParams {
    /** Branch under `aiProcessing.{submitChallenge|reviewTask|reviewCv}`. */
    jobCategory: JobCategory
    /** Picks `queued` | `processing` | `completed` | `failed` copy. */
    jobStatus: JobStatus
    /** Server message when status is failed. */
    error?: string
}

/**
 * Resolves `aiProcessing.*` title/description for a category + status (same keys as {@link AIProcessingModal}).
 */
export const resolveAiProcessingCopy = (
    /** Translations function. */
    t: (key: string) => string,
    /** Parameters for {@link resolveAiProcessingCopy}. */
    {
        jobCategory,
        jobStatus,
        error,
    }: ResolveAiProcessingCopyParams,
): AiProcessingCopy | null => {
    switch (jobStatus) {
    case JobStatus.Queued:
        switch (jobCategory) {
        case JobCategory.ReviewTask:
            return {
                title: t("aiProcessing.reviewTask.queued.title"),
                description: t("aiProcessing.reviewTask.queued.description"),
            }
        case JobCategory.SubmitChallenge:
            return {
                title: t("aiProcessing.submitChallenge.queued.title"),
                description: t("aiProcessing.submitChallenge.queued.description"),
            }
        case JobCategory.ReviewCv:
            return {
                title: t("aiProcessing.reviewCv.queued.title"),
                description: t("aiProcessing.reviewCv.queued.description"),
            }
        case JobCategory.JudgeCoding:
            return {
                title: t("aiProcessing.judgeCoding.queued.title"),
                description: t("aiProcessing.judgeCoding.queued.description"),
            }
        default:
            return null
        }
    case JobStatus.Processing:
        switch (jobCategory) {
        case JobCategory.ReviewTask:
            return {
                title: t("aiProcessing.reviewTask.processing.title"),
                description: t("aiProcessing.reviewTask.processing.description"),
            }
        case JobCategory.SubmitChallenge:
            return {
                title: t("aiProcessing.submitChallenge.processing.title"),
                description: t("aiProcessing.submitChallenge.processing.description"),
            }
        case JobCategory.ReviewCv:
            return {
                title: t("aiProcessing.reviewCv.processing.title"),
                description: t("aiProcessing.reviewCv.processing.description"),
            }
        case JobCategory.JudgeCoding:
            return {
                title: t("aiProcessing.judgeCoding.processing.title"),
                description: t("aiProcessing.judgeCoding.processing.description"),
            }
        default:
            return null
        }
    case JobStatus.Completed:
        switch (jobCategory) {
        case JobCategory.ReviewTask:
            return {
                title: t("aiProcessing.reviewTask.completed.title"),
                description: t("aiProcessing.reviewTask.completed.description"),
            }
        case JobCategory.SubmitChallenge:
            return {
                title: t("aiProcessing.submitChallenge.completed.title"),
                description: t("aiProcessing.submitChallenge.completed.description"),
            }
        case JobCategory.ReviewCv:
            return {
                title: t("aiProcessing.reviewCv.completed.title"),
                description: t("aiProcessing.reviewCv.completed.description"),
            }
        case JobCategory.JudgeCoding:
            return {
                title: t("aiProcessing.judgeCoding.completed.title"),
                description: t("aiProcessing.judgeCoding.completed.description"),
            }
        default:
            return null
        }
    case JobStatus.Failed: {
        let base: Pick<AiProcessingCopy, "title" | "description">
        switch (jobCategory) {
        case JobCategory.ReviewTask:
            base = {
                title: t("aiProcessing.reviewTask.failed.title"),
                description: t("aiProcessing.reviewTask.failed.description"),
            }
            break
        case JobCategory.SubmitChallenge:
            base = {
                title: t("aiProcessing.submitChallenge.failed.title"),
                description: t("aiProcessing.submitChallenge.failed.description"),
            }
            break
        case JobCategory.ReviewCv:
            base = {
                title: t("aiProcessing.reviewCv.failed.title"),
                description: t("aiProcessing.reviewCv.failed.description"),
            }
            break
        case JobCategory.JudgeCoding:
            base = {
                title: t("aiProcessing.judgeCoding.failed.title"),
                description: t("aiProcessing.judgeCoding.failed.description"),
            }
            break
        default:
            return null
        }
        return error
            ? {
                ...base,
                error,
            }
            : base
    }
    default:
        return null
    }
}