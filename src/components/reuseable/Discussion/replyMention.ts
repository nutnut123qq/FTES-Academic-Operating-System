/** The public identity fields needed to address a reply. */
export interface ReplyAuthor {
    displayName?: string | null
    username?: string | null
}

/** Plain-text `@Name ` prefix for a reply composer; missing identities stay blank. */
export const replyMention = (author?: ReplyAuthor | null): string => {
    const name = author?.displayName?.trim() || author?.username?.trim()
    return name ? `@${name} ` : ""
}
