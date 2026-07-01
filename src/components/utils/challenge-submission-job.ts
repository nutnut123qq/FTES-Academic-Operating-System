import type { JobStatusUpdatedSocketIoMessage } from "@/modules/types/socketio"

/**
 * Resolves the latest job-status envelope for a challenge submission row.
 * Prefer `submissionId → jobId` (set on submit); fall back to `jobStatusByJobId[submissionId]`
 * when the server mirrors updates under the submission id.
 */
export const resolveChallengeSubmissionJobEnvelope = (
    submissionId: string,
    submissionIdToJobId: Record<string, string>,
    jobStatusByJobId: Record<string, JobStatusUpdatedSocketIoMessage>,
): JobStatusUpdatedSocketIoMessage | undefined => {
    const jobId = submissionIdToJobId[submissionId]
    if (jobId) {
        const byJobId = jobStatusByJobId[jobId]
        if (byJobId) {
            return byJobId
        }
    }
    return jobStatusByJobId[submissionId]
}
