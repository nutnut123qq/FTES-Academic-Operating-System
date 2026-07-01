"use client"

import React, {
    useEffect,
    useRef,
    useState,
} from "react"
import {
    Typography,
    cn,
} from "@heroui/react"
import {
    SmileyIcon,
} from "@phosphor-icons/react"
import {
    AnimatePresence,
    motion,
} from "framer-motion"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"

/** The six reactions + their emoji glyph, in display order. */
const REACTIONS: ReadonlyArray<{ type: ReactionType, emoji: string }> = [
    { type: ReactionType.Like, emoji: "👍" },
    { type: ReactionType.Love, emoji: "❤️" },
    { type: ReactionType.Haha, emoji: "😄" },
    { type: ReactionType.Wow, emoji: "😮" },
    { type: ReactionType.Sad, emoji: "😢" },
    { type: ReactionType.Angry, emoji: "😠" },
]

/** Emoji glyph by reaction type. */
const EMOJI: Record<ReactionType, string> = REACTIONS.reduce(
    (acc, reaction) => {
        acc[reaction.type] = reaction.emoji
        return acc
    },
    {} as Record<ReactionType, string>,
)

/** Springy pop for the picker container; staggers its emoji children in. */
const PICKER_VARIANTS = {
    hidden: { opacity: 0, y: 8, scale: 0.8 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 500, damping: 30, staggerChildren: 0.03 },
    },
    exit: { opacity: 0, y: 8, scale: 0.8, transition: { duration: 0.12 } },
} as const

/** Each emoji rises + scales in as the picker opens. */
const EMOJI_VARIANTS = {
    hidden: { opacity: 0, y: 6, scale: 0.5 },
    visible: { opacity: 1, y: 0, scale: 1 },
} as const

/** Props for the {@link ReactionBar} block. */
export interface ReactionBarProps extends WithClassNames<undefined> {
    /** Total reactions on the target. */
    count: number
    /** The viewer's own reaction, or null. */
    myReaction: ReactionType | null
    /**
     * React handler — pass the chosen emotion, or `null` to remove. **Omit to make
     * the bar READ-ONLY** (count display only, no picker) — used when the viewer
     * may not react (e.g. their own activity, or anonymous).
     */
    onReact?: (type: ReactionType | null) => void
}

/**
 * Facebook-style reaction bar for a feed item: a react trigger (the viewer's
 * current emoji, or a neutral smiley) that pops a 6-emoji picker, beside the total
 * count. Tapping the same emotion removes it; tapping another switches. When
 * `onReact` is omitted the bar is READ-ONLY — it shows just the count (+ the
 * viewer's emoji) and renders nothing when there are no reactions.
 *
 * Animation is pure `framer-motion` (no third-party emoji asset): the picker
 * springs up + staggers its emoji in, each emoji scales/lifts on hover and
 * squashes on tap, and the trigger emoji pops when the viewer's reaction changes.
 * Pure block: owns its look + the local picker-open state; the owning feature
 * supplies data + the react handler.
 *
 * @param props - {@link ReactionBarProps}
 */
export const ReactionBar = ({
    count,
    myReaction,
    onReact,
    className,
}: ReactionBarProps) => {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    // close the picker when clicking anywhere outside the bar
    useEffect(() => {
        if (!open) {
            return
        }
        const onPointerDown = (event: PointerEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("pointerdown", onPointerDown)
        return () => document.removeEventListener("pointerdown", onPointerDown)
    }, [open])

    // read-only: count + the viewer's emoji; nothing when there are no reactions
    if (!onReact) {
        if (count <= 0) {
            return null
        }
        return (
            <div className={cn("flex items-center gap-1", className)}>
                {myReaction ? <span aria-hidden>{EMOJI[myReaction]}</span> : null}
                <Typography type="body-xs" color="muted">{count}</Typography>
            </div>
        )
    }

    /** Pick (or toggle off) an emotion, then close the picker. */
    const pick = (type: ReactionType) => {
        onReact(myReaction === type ? null : type)
        setOpen(false)
    }

    return (
        <div
            ref={rootRef}
            className={cn("relative flex items-center gap-2", className)}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    setOpen(false)
                }
            }}
        >
            <button
                type="button"
                aria-label="React"
                aria-expanded={open}
                onClick={() => setOpen((previous) => !previous)}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-muted transition-colors hover:bg-default/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {myReaction ? (
                        <motion.span
                            key={myReaction}
                            aria-hidden
                            className="text-sm leading-none"
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 30 }}
                            transition={{ type: "spring", stiffness: 600, damping: 20 }}
                        >
                            {EMOJI[myReaction]}
                        </motion.span>
                    ) : (
                        <motion.span
                            key="placeholder"
                            initial={{ scale: 0.6 }}
                            animate={{ scale: 1 }}
                            className="flex"
                        >
                            <SmileyIcon aria-hidden focusable="false" className="size-4" />
                        </motion.span>
                    )}
                </AnimatePresence>
                {count > 0 ? (
                    <Typography type="body-xs" className={cn(myReaction ? "text-accent" : "text-muted")}>
                        {count}
                    </Typography>
                ) : null}
            </button>

            <AnimatePresence>
                {open ? (
                    <motion.div
                        variants={PICKER_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ transformOrigin: "bottom left" }}
                        className="absolute bottom-full left-0 z-10 mb-1 flex items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-separator"
                    >
                        {REACTIONS.map((reaction) => (
                            <motion.button
                                key={reaction.type}
                                type="button"
                                aria-label={reaction.type}
                                variants={EMOJI_VARIANTS}
                                whileHover={{ scale: 1.4, y: -4 }}
                                whileTap={{ scale: 0.85 }}
                                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                                onClick={() => pick(reaction.type)}
                                className={cn(
                                    "flex size-7 items-center justify-center rounded-full text-base leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                                    myReaction === reaction.type && "bg-accent/10",
                                )}
                            >
                                <span aria-hidden>{reaction.emoji}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}
