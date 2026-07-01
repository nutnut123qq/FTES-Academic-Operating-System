import type { JobStatus } from "../enums"
import type { AbstractEntity } from "./abstract"

/**
 * Background worker job status (queue + BullMQ id).
 */
export interface JobEntity extends AbstractEntity {
    /** The timestamp when the job was queued. */
    queueAt: Date
    /** The name of the queue. */
    queueName: string
    /** The ID of the BullMQ job. */
    bullmqJobId: string | null
    /** The payload of the job. */
    payload: string | null
    /** The status of the job. */
    status: JobStatus
    /** The error of the job. */
    error: string | null
    /** The maximum number of steps of the job. */
    maxSteps: number
    /** The current step of the job. */
    currentStep: number
}
