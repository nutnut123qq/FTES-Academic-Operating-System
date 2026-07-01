"use client"

import React, { useEffect, useState } from "react"
import { Button, TextArea, TextField, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { UserAvatar } from "../UserAvatar"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CommentComposer}. */
export interface CommentComposerProps extends WithClassNames<undefined> {
    /** Called with the trimmed body when the user submits a non-empty comment. */
    onSubmit: (body: string) => void
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
    const handleSubmit = () => {
        if (!trimmed) {
            return
        }
        onSubmit(trimmed)
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
    if (collapsible && !expanded) {
        return (
            <button
                type="button"
                onClick={() => setExpanded(true)}
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
            <TextField variant="primary" className="w-full">
                <TextArea
                    rows={3}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={resolvedPlaceholder}
                    className="resize-none"
                    autoFocus={collapsible}
                />
            </TextField>
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
