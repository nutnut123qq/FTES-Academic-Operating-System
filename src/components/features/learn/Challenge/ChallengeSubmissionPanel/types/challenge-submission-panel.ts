import type { IconComponent } from "@/types"
import type { AiMode, ModelProvider } from "@/modules/api/graphql/queries/query-my-ai-settings"
import type { ChallengeSubmissionEntity } from "@/modules/types/entities/challenge-submission"
import type { JobStatus } from "@/modules/types/enums/job-status"
import type { SubmissionType } from "@/modules/types/enums/submission-type"

/** Lookup from a submission link type to the brand icon shown beside its title. */
export type SubmissionIconMap = Record<SubmissionType, IconComponent>

/** A grading lane + concrete model the user picked for one submission row. */
export interface ChallengeGradeSelection {
    /** Lane the grade runs on (auto = balancer default, premium = the picked model). */
    mode: AiMode
    /** Concrete model name; null on the Auto lane (balancer chooses). */
    model: string | null
    /** Provider serving {@link model}; null on the Auto lane. */
    provider: ModelProvider | null
}

/**
 * Pre-computed render state for a single submission row.
 *
 * The container derives one of these per submission (resolving Formik form state, job
 * status and the active AI-processing job) so each {@link SubmissionRow} stays purely
 * presentational.
 */
export interface ChallengeSubmissionRowViewModel {
    /** The submission entity backing this row. */
    submission: ChallengeSubmissionEntity
    /** Index of the submission within the Formik `submissions` array. */
    index: number
    /** Formik field path for the submission URL input. */
    fieldName: string
    /** DOM id for the submission URL input. */
    inputId: string
    /** Current URL value typed into the input. */
    urlValue: string
    /** Brand icon for the submission link type, if any. */
    iconComponent: IconComponent | undefined
    /** Resolved validation message for the URL field, if shown. */
    errorMessage: string | undefined
    /** True when the URL field has been touched (controls error visibility). */
    isTouched: boolean
    /** Latest known status of the row's grading job, if any. */
    rowJobStatus: JobStatus | undefined
    /** True while the row is queued/processing or the form is submitting. */
    isPending: boolean
    /** True when the row is locked because its job is queued/processing. */
    isInputDisabled: boolean
    /** True when a generic loading spinner should show for this row. */
    isLoading: boolean
    /** Status of the active AI-processing job tied to this row, if any. */
    activeJobStatus: JobStatus | undefined
    /** Error message from the active AI-processing job, if any. */
    activeJobError: string | undefined
    /** True when the active AI-processing panel should render for this row. */
    showActiveJob: boolean
    /** Earned score of the last attempt, when one exists. */
    lastAttemptScore: number | undefined
    /** Maximum score the requirement is worth. */
    maxScore: number
}
