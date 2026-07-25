/**
 * Permalink of a group post.
 *
 * A group post IS a community post (the group feed is a slice of `community.posts`),
 * so the shareable URL is the community post detail route — `/{locale}/community/{postId}`.
 * Sharing the group URL instead (the previous behaviour) dropped the reader on the
 * group's feed with no way to tell WHICH post was shared.
 *
 * @param locale - active locale segment (the app routes are locale-prefixed).
 * @param postId - the post id (community post id carried by the group feed slice).
 * @param origin - absolute origin; defaults to `window.location.origin`, and to `""`
 * during SSR where there is no origin to build an absolute URL from.
 * @returns the absolute permalink, or `""` when no origin is available.
 */
export const groupPostPermalink = (locale: string, postId: string, origin?: string): string => {
    const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "")
    if (!base || !postId) {
        return ""
    }
    return `${base}/${locale}/community/${postId}`
}
