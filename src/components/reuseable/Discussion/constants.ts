import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"

/** A reaction kind's emoji + Facebook Emoji type + i18n label key. */
export interface ReactionDescriptor {
    /** The reaction kind. */
    type: ReactionType
    /** Native emoji glyph (fallback / alt text). */
    emoji: string
    /**
     * The `type` prop value for the `react-facebook-emoji` `FacebookEmoji` component.
     * Maps each ReactionType to the library's lowercase string.
     */
    fbType: "like" | "love" | "haha" | "wow" | "sad" | "angry" | "yay"
    /** i18n key under `discussion.reactions.*` for the accessible label. */
    labelKey: string
}

/** Ordered list of supported reactions (Facebook-style), driving the picker + summary. */
export const REACTIONS: ReadonlyArray<ReactionDescriptor> = [
    {
        type: ReactionType.Like,
        emoji: "👍",
        fbType: "like",
        labelKey: "discussion.reactions.like",
    },
    {
        type: ReactionType.Love,
        emoji: "❤️",
        fbType: "love",
        labelKey: "discussion.reactions.love",
    },
    {
        type: ReactionType.Haha,
        emoji: "😂",
        fbType: "haha",
        labelKey: "discussion.reactions.haha",
    },
    {
        type: ReactionType.Wow,
        emoji: "😮",
        fbType: "wow",
        labelKey: "discussion.reactions.wow",
    },
    {
        type: ReactionType.Sad,
        emoji: "😢",
        fbType: "sad",
        labelKey: "discussion.reactions.sad",
    },
    {
        type: ReactionType.Angry,
        emoji: "😡",
        fbType: "angry",
        labelKey: "discussion.reactions.angry",
    },
]

/** Quick lookup from reaction type → descriptor. */
export const REACTION_BY_TYPE: Record<ReactionType, ReactionDescriptor> = REACTIONS.reduce(
    (acc, descriptor) => {
        acc[descriptor.type] = descriptor
        return acc
    },
    {} as Record<ReactionType, ReactionDescriptor>,
)
