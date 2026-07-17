import React from "react"
import {
    ArrowRightIcon,
    BookOpenIcon,
    ChatCircleIcon,
    FireIcon,
    HeartIcon,
    PencilSimpleLineIcon,
    SignInIcon,
    TargetIcon,
} from "@phosphor-icons/react"
import type { ReactNode } from "react"

/**
 * Icon shown on a quest card, keyed by quest `code`. Unknown codes fall back to
 * {@link QUEST_FALLBACK_ICON} so admin-created quests still render an icon.
 */
export const QUEST_ICON_MAP: Record<string, ReactNode> = {
    DAILY_LOGIN: <SignInIcon className="size-5" aria-hidden focusable="false" />,
    LESSON_COMPLETE: <BookOpenIcon className="size-5" aria-hidden focusable="false" />,
    COMMUNITY_POST: <PencilSimpleLineIcon className="size-5" aria-hidden focusable="false" />,
    COMMUNITY_COMMENT: <ChatCircleIcon className="size-5" aria-hidden focusable="false" />,
    LIKE_3_POSTS: <HeartIcon className="size-5" aria-hidden focusable="false" />,
    STREAK_7_BONUS: <FireIcon className="size-5" aria-hidden focusable="false" />,
}

/** Generic quest icon for codes with no specific mapping. */
export const QUEST_FALLBACK_ICON: ReactNode = (
    <TargetIcon className="size-5" aria-hidden focusable="false" />
)

/** Trailing icon on the "go do it" CTA button. */
export const QUEST_CTA_ICON: ReactNode = (
    <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
)
