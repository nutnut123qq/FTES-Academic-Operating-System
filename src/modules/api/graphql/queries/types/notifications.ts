import type { GraphQLResponse } from "../../types"

/**
 * Kind of notification — mirrors the backend `NotificationType` enum and drives
 * the bell icon + phrasing on the FE.
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

/**
 * An i18n-renderable text on a notification: a message key plus interpolation
 * params. The FE renders `t(key, params)` — the server stores no localized text.
 */
export interface QueryNotificationI18nTextData {
    /** i18n message key. */
    key: string
    /** Interpolation params for the key (counts, names, token labels). */
    params: Record<string, string> | null
}

/**
 * Clickable destination snapshotted on a notification (resolved to a route on
 * the FE from `entityName` + `id`). Null on the notification when targetless.
 */
export interface QueryNotificationTargetData {
    /** Target entity class name (route-index namespace, e.g. ChallengeSubmissionEntity). */
    entityName: string
    /** Target entity primary key (UUID). */
    id: string
    /** Human-readable label rendered as the token text. */
    label: string
}

/** One in-app notification in the recipient's bell list. */
export interface QueryNotificationData {
    /** Notification row id. */
    id: string
    /** Kind of notification (drives the FE icon + phrasing). */
    type: NotificationType
    /** Headline as i18n (key + params); rendered client-side. */
    title: QueryNotificationI18nTextData
    /** Optional supporting line as i18n; null when the title is enough. */
    body: QueryNotificationI18nTextData | null
    /** Whether the recipient has read the notification. */
    isRead: boolean
    /** Clickable destination; null for targetless messages. */
    target: QueryNotificationTargetData | null
    /** When the recipient read the notification (ISO); null while unread. */
    readAt: string | null
    /** When the notification was created (ISO). */
    createdAt: string
}

/** Paginated bell list for the current user (newest first) + unread total. */
export interface QueryMyNotificationsData {
    /** Notification rows for the requested page, newest first. */
    items: Array<QueryNotificationData>
    /** Total rows matching the filter (across all pages). */
    total: number
    /** Unread notification count for the user (badge value). */
    unreadCount: number
}

/** Apollo response shape for the `myNotifications` query. */
export interface QueryMyNotificationsResponse {
    /** Top-level `myNotifications` field wrapping the standard API response. */
    myNotifications: GraphQLResponse<QueryMyNotificationsData>
}
