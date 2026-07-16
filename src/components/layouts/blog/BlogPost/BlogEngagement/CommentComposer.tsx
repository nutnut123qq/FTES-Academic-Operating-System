"use client"

import React, { useState } from "react"
import { Button, TextArea, TextField, cn } from "@heroui/react"
import { useTranslations } from "next-intl"

import type { WithClassNames } from "@/modules/types/base/class-name"

/** Max comment length — matches the backend `@Size(max = 5000)` on the create/update DTO. */
export const BLOG_COMMENT_MAX_LENGTH = 5000

/** Props for {@link CommentComposer}. */
export interface CommentComposerProps extends WithClassNames<undefined> {
    /** Placeholder text (doubles as the textarea's accessible label). */
    placeholder: string
    /** Label of the submit button. */
    submitLabel: string
    /**
     * Submits the trimmed draft; resolves `true` on success (draft is cleared for
     * the create composer) or `false` on failure (draft kept + inline error shown).
     */
    onSubmit: (text: string) => Promise<boolean>
    /** Prefilled text — the inline edit composer seeds the existing comment body. */
    initialValue?: string
    /** Optional cancel affordance (edit composer). */
    onCancel?: () => void
    /** Label for the cancel button (required to render it). */
    cancelLabel?: string
    /** True while a create/update mutation is in flight (blocks double-submit). */
    isSubmitting: boolean
    /** Autofocus the textarea on mount (edit composer). */
    autoFocus?: boolean
}

/**
 * Flat comment composer: a HeroUI textarea + submit with a 5000-char counter,
 * empty/whitespace submit blocking, and a `role="alert"` submit error that keeps
 * the draft for retry. Reused for the main "new comment" composer and the inline
 * edit composer (seeded via {@link CommentComposerProps.initialValue}). Guest
 * gating is handled by the parent, which renders a sign-in affordance instead of
 * this composer, so no auth guard lives here.
 * @param props - {@link CommentComposerProps}
 */
export const CommentComposer = ({
    placeholder,
    submitLabel,
    onSubmit,
    initialValue = "",
    onCancel,
    cancelLabel,
    isSubmitting,
    autoFocus,
    className,
}: CommentComposerProps) => {
    const t = useTranslations("blog.engagement")
    // draft kept local; only cleared on a successful submit (failure restores it)
    const [text, setText] = useState(initialValue)
    const [submitFailed, setSubmitFailed] = useState(false)

    const trimmed = text.trim()
    const atLimit = text.length >= BLOG_COMMENT_MAX_LENGTH

    const handleSubmit = async () => {
        if (!trimmed || isSubmitting) {
            return
        }
        setSubmitFailed(false)
        const ok = await onSubmit(trimmed)
        if (ok) {
            // edit composers unmount on success; the create composer resets its draft
            setText("")
        } else {
            setSubmitFailed(true)
        }
    }

    return (
        <div className={cn("flex w-full flex-col gap-2", className)}>
            <TextField variant="primary" className="w-full">
                <TextArea
                    rows={2}
                    value={text}
                    // hard 5000-char cap: never accept input beyond the limit
                    onChange={(event) =>
                        setText(event.target.value.slice(0, BLOG_COMMENT_MAX_LENGTH))
                    }
                    maxLength={BLOG_COMMENT_MAX_LENGTH}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    autoFocus={autoFocus}
                    className="resize-none"
                />
            </TextField>
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={cn(
                        "text-xs",
                        atLimit ? "font-medium text-danger" : "text-muted",
                    )}
                >
                    {t("counter", { count: text.length, limit: BLOG_COMMENT_MAX_LENGTH })}
                </span>
                {submitFailed ? (
                    <span role="alert" className="text-xs text-danger">
                        {t("submitError")}
                    </span>
                ) : null}
                <span className="flex-1" />
                {onCancel && cancelLabel ? (
                    <Button
                        size="sm"
                        variant="tertiary"
                        onPress={onCancel}
                        isDisabled={isSubmitting}
                    >
                        {cancelLabel}
                    </Button>
                ) : null}
                <Button
                    size="sm"
                    variant="primary"
                    onPress={() => {
                        void handleSubmit()
                    }}
                    isPending={isSubmitting}
                    isDisabled={!trimmed || isSubmitting}
                >
                    {submitLabel}
                </Button>
            </div>
        </div>
    )
}
