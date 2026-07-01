"use client"

import React, {
    useState,
} from "react"
import {
    cn,
} from "@heroui/react"
import {
    CheckCircleIcon,
} from "@phosphor-icons/react"
import {
    useTranslations,
} from "next-intl"
import {
    SiGithub,
} from "@icons-pack/react-simple-icons"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import type { QueryUserSolvedChallengeItemData } from "@/modules/api/graphql/queries/types/user-solved-challenges"

/** Maximum number of challenge chips rendered before the overflow pill. */
const MAX_VISIBLE_CHIPS = 12

/** Props for {@link ChallengeChips}. */
export interface ChallengeChipsProps extends WithClassNames<undefined> {
    /** The user's passed challenge submissions to render as chips. */
    challenges: ReadonlyArray<QueryUserSolvedChallengeItemData>
}

/**
 * Compact chip grid of a user's solved challenges. Challenges are "many small
 * graded exercises", so each is a small pill (check + truncated title + optional
 * language tag) linking out to the submitted repo / doc — never one card per item.
 * Caps at {@link MAX_VISIBLE_CHIPS}; any overflow collapses into a muted "+N" pill.
 *
 * @param props - {@link ChallengeChipsProps}
 */
export const ChallengeChips = ({
    challenges,
    className,
}: ChallengeChipsProps) => {
    const t = useTranslations()

    /** Whether the overflow chips are expanded (purely presentational). */
    const [showAll, setShowAll] = useState(false)

    const visible = showAll ? challenges : challenges.slice(0, MAX_VISIBLE_CHIPS)
    const overflow = challenges.length - visible.length

    return (
        <div className={cn("flex flex-wrap gap-1.5", className)}>
            {visible.map((challenge, index) => (
                <a
                    key={challenge.submissionUrl + "-" + index}
                    href={challenge.submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={challenge.title}
                    className="flex max-w-full items-center gap-1.5 rounded-full border border-default/40 px-3 py-1.5 outline-none hover:border-default focus-visible:ring-2 focus-visible:ring-accent"
                >
                    <CheckCircleIcon className="size-5 shrink-0 text-success" />
                    <SiGithub className="size-5 shrink-0 text-muted" />
                    <span className="truncate text-xs font-medium text-foreground">
                        {challenge.title}
                    </span>
                    {challenge.selectedLang ? (
                        <span className="shrink-0 rounded-medium bg-default/40 px-1.5 py-0.5 text-[11px] text-foreground">
                            {challenge.selectedLang}
                        </span>
                    ) : null}
                </a>
            ))}
            {overflow > 0 ? (
                <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="flex items-center rounded-full border border-default/40 px-3 py-1.5 text-xs text-muted outline-none hover:border-default hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent"
                >
                    {t("publicProfile.capstone.more", { count: overflow })}
                </button>
            ) : null}
        </div>
    )
}
