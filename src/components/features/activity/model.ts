/**
 * Activity Engine event types → what the user actually reads.
 *
 * The BE emits ~55 catalogued dotted types plus a long tail of module-local ones
 * (`resource.fe.image.added`, `profile.updated`, …) that were never seeded into
 * `activity.event_types`. Two consequences drive this module:
 *
 * 1. **The BE carries no rendered sentence.** `GET /activities` returns the dotted
 *    `type` and ref ids only. `GET /activities/types` has a `description`, but it is
 *    seeded VIETNAMESE-ONLY and covers just the catalogued types — so the timeline used
 *    to print the raw `type` (`profile.updated`) whenever a type was missing from the
 *    catalog, and Vietnamese prose to English viewers whenever it was present. Both
 *    render paths are replaced by i18n here, and the `/activities/types` call is gone.
 *
 * 2. **Unknown types must NEVER reach the screen.** `ActivityPersister` writes any
 *    envelope it can parse — no catalog check — so a module shipping a new event type
 *    puts it on user timelines the same day, months before anyone adds a translation.
 *    {@link activityMessageKey} therefore resolves through an explicit allow-list and
 *    falls back to `other` ("Other activity"), a plain sentence that is vague but never
 *    leaks an internal identifier. **Adding a type here is optional; forgetting to is
 *    safe.** If you want a new type spelled out, add one line to
 *    {@link EVENT_MESSAGE_KEY} and one string per locale under `activity.events`.
 */

/** The kinds of activity the FE renders — each maps to an icon. */
export type ActivityKind =
    | "courseEnrolled"
    | "lessonCompleted"
    | "resourceUploaded"
    | "questionPosted"
    | "badgeEarned"
    | "coinEarned"
    | "eventJoined"
    | "groupJoined"
    | "other"

/**
 * Buckets a dotted BE type into an icon-bearing kind by DOTTED PREFIX (`course.*`,
 * `lesson.*`, …) so new BE types keep landing on a sensible icon instead of "other".
 */
export const toActivityKind = (type: string): ActivityKind => {
    if (type.startsWith("course.")) return "courseEnrolled"
    if (type.startsWith("lesson.") || type.startsWith("quiz.")) return "lessonCompleted"
    if (type.startsWith("resource.") || type.startsWith("collection.")) return "resourceUploaded"
    if (
        type.startsWith("community.")
        || type.startsWith("question.")
        || type.startsWith("answer.")
    ) {
        return "questionPosted"
    }
    if (type.startsWith("badge.") || type.startsWith("gamification.")) return "badgeEarned"
    if (type.startsWith("coin.") || type.startsWith("wallet.") || type.startsWith("order.")) {
        return "coinEarned"
    }
    if (type.startsWith("event.")) return "eventJoined"
    if (type.startsWith("group.")) return "groupJoined"
    return "other"
}

/** Message key used whenever a type has no sentence of its own. */
export const ACTIVITY_FALLBACK_MESSAGE_KEY = "other"

/**
 * Dotted BE event type → leaf under `activity.events` in the message catalogs.
 * Several types share one sentence on purpose (`course.completed` and
 * `course.enrollment.completed` read the same to a human).
 */
const EVENT_MESSAGE_KEY: Readonly<Record<string, string>> = {
    // identity + profile
    "user.registered": "userRegistered",
    "profile.created": "profileCreated",
    "profile.updated": "profileUpdated",
    "profile.achievement.added": "achievementAdded",
    "profile.followed": "userFollowed",
    "profile.unfollowed": "userUnfollowed",

    // learning
    "course.enrolled": "courseEnrolled",
    "course.unenrolled": "courseUnenrolled",
    "course.completed": "courseCompleted",
    "course.enrollment.completed": "courseCompleted",
    "lesson.completed": "lessonCompleted",
    "course.lesson.completed": "lessonCompleted",
    "lesson.preview.started": "lessonPreviewStarted",
    "lesson.liked": "lessonLiked",
    "quiz.passed": "quizPassed",
    "quiz.attempted": "quizAttempted",
    "assignment.submitted": "assignmentSubmitted",
    "course.assignment.graded": "assignmentGraded",
    "certificate.issued": "certificateIssued",

    // subjects
    "subject.joined": "subjectJoined",
    "subject.member.joined": "subjectJoined",
    "subject.member.left": "subjectLeft",

    // resources (incl. the PE / FE exam surfaces)
    "resource.submitted": "resourceSubmitted",
    "resource.created": "resourceUploaded",
    "resource.uploaded": "resourceUploaded",
    "resource.updated": "resourceUpdated",
    "resource.published": "resourcePublished",
    "resource.approved": "resourceApproved",
    "resource.rejected": "resourceRejected",
    "resource.unpublished": "resourceUnpublished",
    "resource.downloaded": "resourceDownloaded",
    "resource.viewed": "resourceViewed",
    "resource.favorited": "resourceFavorited",
    "resource.rated": "resourceRated",
    "resource.rating.removed": "resourceRatingRemoved",
    "resource.commented": "resourceCommented",
    "resource.version.uploaded": "resourceVersionUploaded",
    "resource.version.published": "resourceVersionPublished",
    "resource.fe.image.added": "feImageAdded",
    "resource.fe.image.removed": "feImageRemoved",
    "resource.fe.image.commented": "feImageCommented",
    "resource.pe.submitted": "peSubmitted",
    "resource.pe.scored": "peScored",
    "resource.pe.failed": "peFailed",
    "collection.created": "collectionCreated",
    "collection.item.added": "collectionItemAdded",

    // community
    "question.posted": "questionPosted",
    "answer.accepted": "answerAccepted",
    "community.answer.accepted": "answerAccepted",
    "community.post.created": "postCreated",
    "community.post.updated": "postUpdated",
    "community.post.shared": "postShared",
    "community.comment.created": "commentCreated",
    "community.reaction.added": "reactionAdded",
    "community.vote.cast": "voteCast",
    "community.poll.voted": "pollVoted",
    "community.user.followed": "userFollowed",
    "community.user.mentioned": "userMentioned",
    "community.bookmark.added": "bookmarkAdded",
    "community.bookmark.removed": "bookmarkRemoved",

    // groups
    "group.joined": "groupJoined",
    "group.member.joined": "groupJoined",
    "group.member.left": "groupLeft",
    "group.created": "groupCreated",
    "group.thread.created": "groupThreadCreated",
    "group.thread.comment.created": "groupThreadCommented",
    "group.announcement.created": "groupAnnouncementCreated",
    "group.event.created": "groupEventCreated",
    "group.event.rsvp.added": "groupEventRsvp",

    // challenges
    "challenge.completed": "challengeCompleted",
    "challenge.attempt.completed": "challengeCompleted",
    "challenge.submission.submitted": "challengeSubmitted",
    "challenge.submission.scored": "challengeScored",
    "challenge.reward.granted": "challengeRewarded",
    "challenge.published": "challengePublished",
    "challenge.closed": "challengeClosed",

    // gamification
    "badge.earned": "badgeEarned",
    "gamification.badge.awarded": "badgeEarned",
    "gamification.badge.earned": "badgeEarned",
    "gamification.level.up": "levelUp",
    "gamification.mastery.levelup": "masteryLevelUp",
    "gamification.streak.milestone": "streakMilestone",
    "gamification.reward.claimed": "rewardClaimed",
    "gamification.quest.completed": "questCompleted",
    "gamification.goal.completed": "goalCompleted",
    "gamification.xp.granted": "xpGranted",
    "gamification.season.closed": "seasonClosed",

    // wallet + commerce
    "coin.earned": "coinEarned",
    "gamification.coin.earned": "coinEarned",
    "coin.spent": "coinSpent",
    "coin.transferred": "coinTransferred",
    "coin.refunded": "coinRefunded",
    "coin.adjusted": "coinAdjusted",
    "order.created": "orderCreated",
    "order.paid": "orderPaid",
    "order.fulfilled": "orderFulfilled",
    "order.refunded": "orderRefunded",

    // events
    "event.joined": "eventJoined",
    "event.registration.confirmed": "eventRegistered",
    "event.checkin.recorded": "eventCheckedIn",
    "event.certificate.issued": "eventCertificateIssued",
    "event.published": "eventPublished",
    "event.ended": "eventEnded",

    // question bank
    "questionbank.item.solved": "practiceSolved",
    "questionbank.item.failed": "practiceFailed",

    // AI
    "ai.job.completed": "aiJobCompleted",
    "ai.grading.completed": "aiGradingCompleted",
    "ai.studyplan.created": "aiStudyPlanCreated",
    "ai.document.qa.answered": "aiDocumentAnswered",
    "ai.interview.attempt.finished": "aiInterviewFinished",

    // career
    "career.roadmap.enrolled": "careerRoadmapEnrolled",
    "career.roadmap.completed": "careerRoadmapCompleted",
    "career.application.submitted": "careerApplicationSubmitted",
    "career.mentorship.requested": "mentorshipRequested",
    "career.mentorship.accepted": "mentorshipAccepted",

    // recommendations
    "recommendation.feedback.recorded": "recommendationFeedback",
}

/** Every leaf this module can return — used by the test to check both catalogs. */
export const ACTIVITY_MESSAGE_KEYS: ReadonlyArray<string> = [
    ...new Set([...Object.values(EVENT_MESSAGE_KEY), ACTIVITY_FALLBACK_MESSAGE_KEY]),
]

/**
 * Resolves a dotted BE event type to its leaf under `activity.events`.
 * Unknown (or empty) types resolve to {@link ACTIVITY_FALLBACK_MESSAGE_KEY} — the raw
 * type is never handed to the renderer.
 */
export const activityMessageKey = (type: string | null | undefined): string =>
    (type && EVENT_MESSAGE_KEY[type]) || ACTIVITY_FALLBACK_MESSAGE_KEY
