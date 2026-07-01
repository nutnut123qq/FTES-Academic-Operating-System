"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { REACTIONS } from "./constants"
import { ReactionEmoji } from "./ReactionEmoji"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link FacebookReactionSelector}. */
export interface FacebookReactionSelectorProps extends WithClassNames<undefined> {
    /** The viewer's current reaction, highlighted in the bar (null = none). */
    active?: ReactionType | null
    /** Called with the picked emotion. */
    onSelect: (type: ReactionType) => void
}

/**
 * Facebook-style reaction picker bar — the six emotions in a row, each scaling up and
 * lifting with its name floating above on hover, popping in with a slight stagger when
 * the bar appears.
 *
 * Reimplemented natively (native emoji glyphs + CSS keyframe `reactionPop`, NO third-party
 * reaction library) so it follows our design tokens + dark mode. The pop-in animation sits
 * on the button while the hover scale sits on an inner span, so the two transforms never
 * clash. Render inside the reaction Popover; selection is delegated via `onSelect`.
 *
 * @param props - {@link FacebookReactionSelectorProps}
 */
export const FacebookReactionSelector = ({ active, onSelect, className }: FacebookReactionSelectorProps) => {
    const t = useTranslations()

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {REACTIONS.map((reaction, index) => {
                const label = t(reaction.labelKey)
                return (
                    <button
                        key={reaction.type}
                        type="button"
                        aria-label={label}
                        aria-pressed={active === reaction.type}
                        onClick={() => onSelect(reaction.type)}
                        // each emoji bounces in slightly after the previous one
                        style={{ animationDelay: `${index * 35}ms` }}
                        className={cn(
                            "group/fbreact relative flex animate-[reactionPop_220ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                            "cursor-pointer items-center justify-center rounded-full p-1 outline-none",
                            "focus-visible:ring-2 focus-visible:ring-accent",
                            active === reaction.type ? "bg-accent/10" : undefined,
                        )}
                    >
                        {/* reaction name floats above on hover, à la Facebook */}
                        <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 scale-90 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 transition-all duration-150 group-hover/fbreact:scale-100 group-hover/fbreact:opacity-100">
                            {label}
                        </span>
                        {/* emoji scales up + lifts on hover (transform isolated from the pop-in) */}
                        <span className="block origin-bottom transition-transform duration-150 ease-out group-hover/fbreact:-translate-y-1 group-hover/fbreact:scale-[1.45]">
                            <ReactionEmoji descriptor={reaction} size="md" />
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
