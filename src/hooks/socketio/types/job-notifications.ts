/** Subscription target of a {@link SubscribeJobNotificationSocketIoPayload}. */
export interface SubscribeJobNotificationData {
    /** The background job id to subscribe to. */
    jobId: string
}

/**
 * Client publish to subscribe to updates for a given job (and locale for copy).
 */
export interface SubscribeJobNotificationSocketIoPayload {
    /** The job to subscribe to. */
    data: SubscribeJobNotificationData
    /** Locale used for server-rendered status copy. */
    locale: string
}
