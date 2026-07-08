import useSWRMutation from "swr/mutation"
import { enrollCourseDirect } from "@/modules/api/rest/course/course"
import type { EnrollResponse } from "@/modules/api/rest/course/types"

/** Argument for the trial mutation — the course to free-enroll into. */
interface StartTrialArg {
    /** Course id to start a trial (free-enroll) for. */
    courseId: string
}

/**
 * SWR mutation for the "Học thử" CTA: best-effort free-enroll via
 * `POST /api/v1/courses/{id}/enroll` (REST — the BE GraphQL is query-only, so
 * the old `startTrial` GraphQL mutation never resolved). Free courses get a
 * tracked enrollment; paid courses throw `COURSE_ACCESS_DENIED` (payment-bypass
 * guard) which the caller swallows and still routes into the free/preview content.
 */
export const useMutateStartTrialSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<EnrollResponse, Error, string, StartTrialArg>(
        "MUTATE_START_TRIAL_SWR",
        async (_key, { arg }) => enrollCourseDirect(arg.courseId),
    )
    /** Return the SWR mutation. */
    return swr
}
