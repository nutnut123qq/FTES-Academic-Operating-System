/**
 * Per-surface engagement matrix config. Each flag selects whether one action
 * renders in the bar; ALL default to `true` (a bare bar renders the full set).
 * A surface hides an action by passing `false` — the button is NOT rendered
 * (absent, not merely disabled). See openspec/changes/post-engagement Decision 0.
 */
export interface EngagementActions {
    /** Render the ♥ like button (default true). */
    like?: boolean
    /** Render the 💬 comment button (default true). */
    comment?: boolean
    /** Render the 🔁 share menu (default true). */
    share?: boolean
    /** Render the 🔖 save button (default true). */
    save?: boolean
}

/**
 * FULL bar preset — like + comment + share + save. Posts (community feed +
 * detail, group feed) and articles/blog.
 */
export const POST_ENGAGEMENT_ACTIONS: EngagementActions = {
    like: true,
    comment: true,
    share: true,
    save: true,
}

/**
 * DISCUSSION preset — like + comment ONLY (no share, no save). Group discussion
 * threads and the subject workspace "Thảo luận" tab. Discussion threads are
 * ephemeral conversation, never shareable/bookmarkable long-form content.
 */
export const DISCUSSION_ENGAGEMENT_ACTIONS: EngagementActions = {
    like: true,
    comment: true,
    share: false,
    save: false,
}
