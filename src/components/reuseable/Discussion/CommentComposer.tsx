"use client"

import React, { useEffect, useState } from "react"
import { Button, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { UserAvatar } from "../UserAvatar"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CommentComposer}. */
export interface CommentComposerProps extends WithClassNames<undefined> {
    /** Called with the trimmed body when the user submits a non-empty comment. */
    /**
     * Hands the trimmed draft over. Return `false` (or a promise of it) to say the send
     * FAILED and keep the draft in the box; anything else — including the plain `void`
     * every older caller returns — clears it as before.
     *
     * The escape hatch exists because clearing unconditionally loses what the reader
     * typed the moment the network hiccups: they watch a long reply vanish and have
     * nothing to retry with. Opt-in rather than required, so callers that genuinely
     * cannot fail (or do their own optimistic insert) stay untouched.
     */
    onSubmit: (body: string) => void | boolean | Promise<void | boolean>
    /** Placeholder text for the textarea. */
    placeholder?: string
    /** Label for the submit button (defaults to a generic "post" copy). */
    submitLabel?: string
    /** Optional cancel handler (renders a cancel button when provided, e.g. for replies/edits). */
    onCancel?: () => void
    /** Initial textarea value (e.g. when editing an existing comment). */
    initialValue?: string
    /** Disables submit while a mutation is in flight. */
    busy?: boolean
    /**
     * When set, the composer is avatar-led: a leading {@link UserAvatar} sits beside the
     * field, and (with `collapsible`) the collapsed pill shows it too.
     */
    currentUser?: { username: string, avatar?: string } | null
    /**
     * Start collapsed as a slim "write a comment" pill (avatar + placeholder) and expand
     * to the full textarea on click — the top-level composer pattern. Reply/edit composers
     * omit this and render expanded.
     */
    collapsible?: boolean
    /**
     * Optional guard run when a `collapsible` composer is about to expand. Return `false`
     * to BLOCK expansion (e.g. a guest gate that opens the auth modal instead) so the
     * draft is never lost at a submit-time gate. No-op for non-collapsible composers.
     */
    onBeforeExpand?: () => boolean
    /**
     * Focus the editor as soon as it renders. Defaults to `collapsible`, i.e. a composer
     * that just expanded keeps the caret.
     *
     * A REPLY composer is NOT collapsible, so it does not get this by default and has to
     * ask for it explicitly — which it should: it only exists because the reader just
     * pressed "reply", and making them click again to type is a regression. Do not drop
     * the prop at those call sites on the assumption that the default covers it.
     */
    autoFocus?: boolean
}

/**
 * A textarea + submit control used for new comments, replies, and edits.
 *
 * For the top-level composer pass `collapsible` + `currentUser`: it renders as a slim
 * avatar + placeholder pill and expands to the textarea on focus (à la YouTube / GitHub),
 * so an empty grey box never dominates the discussion zone.
 *
 * Presentational: owns only the draft text + expand state; submit/cancel are delegated.
 * @param props - {@link CommentComposerProps}
 */
export const CommentComposer = ({
    onSubmit,
    placeholder,
    submitLabel,
    onCancel,
    initialValue,
    busy,
    currentUser,
    collapsible,
    onBeforeExpand,
    autoFocus = collapsible,
    className,
}: CommentComposerProps) => {
    const t = useTranslations()
    // draft body kept local until submit
    const [body, setBody] = useState(initialValue ?? "")
    // collapsible composers start closed; everything else is always open
    const [expanded, setExpanded] = useState(!collapsible)
    // sync when the parent passes a new initialValue (e.g. editing a different comment)
    useEffect(() => {
        setBody(initialValue ?? "")
    }, [initialValue])
    const trimmed = body.trim()
    const resolvedPlaceholder = placeholder ?? t("discussion.placeholder")

    // submit only non-empty drafts, then clear (and re-collapse a collapsible composer)
    // — unless the caller says the send failed, in which case the draft stays put so the
    // reader can retry instead of retyping. `await` handles the async callers; a `void`
    // return resolves to `undefined`, which is not `false`, so old behaviour is intact.
    const handleSubmit = async () => {
        if (!trimmed) {
            return
        }
        const sent = await onSubmit(trimmed)
        if (sent === false) {
            return
        }
        setBody("")
        if (collapsible) {
            setExpanded(false)
        }
    }

    const handleCancel = () => {
        setBody("")
        if (collapsible) {
            setExpanded(false)
        }
        onCancel?.()
    }

    // collapsed pill: avatar + placeholder, the whole row opens the composer
    // (unless a guard blocks it, e.g. a guest is sent to the auth modal first)
    const handleExpand = () => {
        if (onBeforeExpand && !onBeforeExpand()) {
            return
        }
        setExpanded(true)
    }

    if (collapsible && !expanded) {
        return (
            <button
                type="button"
                onClick={handleExpand}
                className={cn("flex w-full items-center gap-3 text-left", className)}
            >
                {currentUser ? (
                    <UserAvatar
                        size="sm"
                        username={currentUser.username}
                        avatar={currentUser.avatar}
                        className="shrink-0"
                    />
                ) : null}
                <span className="flex-1 cursor-pointer rounded-xl border border-default bg-surface px-4 py-2 text-sm text-muted transition-colors hover:bg-default">
                    {resolvedPlaceholder}
                </span>
            </button>
        )
    }

    const form = (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <RichTextEditor
                value={body}
                onChange={setBody}
                toolbar="comment"
                placeholder={resolvedPlaceholder}
                ariaLabel={resolvedPlaceholder}
                autoFocus={autoFocus}
            />
            <div className="flex items-center justify-start gap-2">
                <Button
                    size="sm"
                    variant="primary"
                    onPress={handleSubmit}
                    // spinner + auto-disable while the mutation is in flight (blocks double-submit)
                    isPending={Boolean(busy)}
                    isDisabled={!trimmed}
                >
                    {submitLabel ?? t("discussion.post")}
                </Button>
                {onCancel || collapsible ? (
                    <Button size="sm" variant="tertiary" onPress={handleCancel} isDisabled={busy}>
                        {t("common.cancel")}
                    </Button>
                ) : null}
            </div>
        </div>
    )

    // avatar-led when a viewer is known, else just the field (reply/edit keep old layout)
    return (
        <div className={cn("flex gap-3", className)}>
            {currentUser ? (
                <UserAvatar
                    size="sm"
                    username={currentUser.username}
                    avatar={currentUser.avatar}
                    className="mt-0.5 shrink-0"
                />
            ) : null}
            {form}
        </div>
    )
}
