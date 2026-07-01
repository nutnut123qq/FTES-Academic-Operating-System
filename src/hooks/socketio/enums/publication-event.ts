/** Socket.IO publication event names (client → server). */
export enum PublicationEvent {
    GlobalSearch = "autocomplete.global_search.publication",
    SubscribeJobNotification = "job_notifications.subscribe_job_notification.publication",
    /** Join a content's discussion room (must match backend). */
    SubscribeContentDiscussion = "content_discussion.subscribe.publication",
    /** Subscribe to an AI Lab run's token stream (must match backend). */
    SubscribeAiLabRun = "ai_lab.subscribe_run.publication",
    /** Abort an in-flight AI Lab run (must match backend). */
    AbortAiLabRun = "ai_lab.abort_run.publication",
    /** Join a chat conversation's room (must match backend). */
    SubscribeCommunityChat = "community_chat.subscribe.publication",
    /** Ask StarCi AI about a content and stream the answer (must match backend). */
    AskContentAi = "content_ai.ask.publication",
    /** Abort an in-flight content-AI answer stream (must match backend). */
    AbortContentAi = "content_ai.abort.publication",
}
