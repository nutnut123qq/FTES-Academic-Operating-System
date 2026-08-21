/**
 * Mirror of the backend `vn.ftes.aos.notification.domain.NotificationType`
 * enum — the business notification types accepted by the notification module.
 *
 * Delivered in-app rows (`GET /api/v1/notifications`) carry these names in
 * `item.type`, and the preference matrix (`GET/PUT
 * /api/v1/notifications/preferences`) keys its cells by them, so the per-type
 * preference toggles and the delivered-list filter share one key space.
 */
export enum NotificationType {
    /** Someone mentioned the recipient (comments, threads). */
    Mention = "MENTION",
    /** Course activity for an enrolled course (new content, updates). */
    Course = "COURSE",
    /** Event activity (invites, reminders, changes). */
    Event = "EVENT",
    /** An upcoming or missed deadline. */
    Deadline = "DEADLINE",
    /** Challenge activity (grading results, new challenges). */
    Challenge = "CHALLENGE",
    /** Coin / wallet activity (earned, spent, granted). */
    Coin = "COIN",
    /** Group activity (membership, posts, replies). */
    Group = "GROUP",
    /** Generic system message with no specific domain target. */
    System = "SYSTEM",
    /** A paid order has been fulfilled and is ready to use. */
    Order = "ORDER",
    /** Someone commented on the recipient's post or replied to their comment. */
    Comment = "COMMENT",
    /** Someone reacted to the recipient's post or comment. */
    Reaction = "REACTION",
}
