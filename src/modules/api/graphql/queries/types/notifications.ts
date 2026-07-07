/**
 * Notification-type key space for the FE-only preferences mock
 * (`query-my-notification-preferences.ts` + the preferences surface).
 *
 * NOTE: the delivered in-app notifications now come from the real BE REST API
 * (`GET /api/v1/notifications`), whose `type` is the backend
 * `vn.ftes.aos.notification.domain.NotificationType` enum
 * (`MENTION`/`COURSE`/`EVENT`/`DEADLINE`/`CHALLENGE`/`COIN`/`GROUP`) handled as a
 * plain string + {@link resolveNotificationIcon}. This enum survives only to key
 * the client-side preferences mock; there is no `MyNotifications` GraphQL op (the
 * FTES GraphQL schema has no notifications field).
 */
export enum NotificationType {
    /** Generic system message with no specific domain target. */
    System = "system",
    /** A challenge submission finished grading (passed or failed). */
    ChallengeGraded = "challengeGraded",
    /** A coding submission finished judging (a verdict is available). */
    CodingGraded = "codingGraded",
    /** A personal-project milestone task finished grading. */
    MilestoneGraded = "milestoneGraded",
    /** Another user started following the recipient. */
    NewFollower = "newFollower",
    /** Someone replied to one of the recipient's discussion comments. */
    CommentReply = "commentReply",
    /** A paid AI subscription / membership tier was granted to the recipient. */
    SubscriptionGranted = "subscriptionGranted",
    /** A broadcast announcement fanned out to the recipient. */
    Announcement = "announcement",
}
