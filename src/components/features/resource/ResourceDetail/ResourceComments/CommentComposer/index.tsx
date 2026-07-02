"use client"

import React, { useState } from "react"
import { Button, TextArea, TextField, cn } from "@heroui/react"
import { useTranslations } from "next-intl"

import type { WithClassNames } from "@/modules/types/base/class-name"

/** Max comment length (spec: 500 chars, visible counter). */
export const RESOURCE_COMMENT_MAX_LENGTH = 500

/** Props for {@link CommentComposer}. */
export interface CommentComposerProps extends WithClassNames<undefined> {
    /** Placeholder text (doubles as the textarea's accessible label). */
    placeholder: string
    /** Label of the submit button. */
    submitLabel: string
    /**
     * Submits the trimmed draft; resolves `true` on success (draft is cleared)
     * or `false` on failure (draft kept + inline error shown).
     */
    onSubmit: (text: string) => Promise<boolean>
    /**
     * Auth gate — returns `true` when the viewer may interact. Called on focus
     * and submit; a guest gets the auth modal and the composer blurs.
     */
    onRequireAuth: () => boolean
    /** Optional cancel affordance (reply composers). */
    onCancel?: () => void
    /** Label for the cancel button (required to render it). */
    cancelLabel?: string
    /** True while the create mutation is in flight (blocks double-submit). */
    isSubmitting: boolean
    /** Autofocus the textarea on mount (reply composers). */
    autoFocus?: boolean
}

/**
 * Comment composer: a HeroUI textarea + submit with a 500-char counter, empty/
 * whitespace submit blocking, guest gating on focus, and a `role="alert"` submit
 * error that keeps the draft for retry. Used for both the main composer and the
 * inline reply composer (the parent owns responsive placement).
 * @param props - {@link CommentComposerProps}
 */
export const CommentComposer = ({
    placeholder,
    submitLabel,
    onSubmit,
    onRequireAuth,
    onCancel,
    cancelLabel,
    isSubmitting,
    autoFocus,
    className,
}: CommentComposerProps) => {
    const t = useTranslations()
    // draft kept local; only cleared on a successful submit (failure restores it)
    const [text, setText] = useState("")
    const [submitFailed, setSubmitFailed] = useState(false)

    const trimmed = text.trim()
    const atLimit = text.length >= RESOURCE_COMMENT_MAX_LENGTH

    const handleSubmit = async () => {
        if (!trimmed || isSubmitting || !onRequireAuth()) {
            return
        }
        setSubmitFailed(false)
        const ok = await onSubmit(trimmed)
        if (ok) {
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
                    // hard 500-char cap: never accept input beyond the limit
                    onChange={(event) =>
                        setText(event.target.value.slice(0, RESOURCE_COMMENT_MAX_LENGTH))
                    }
                    maxLength={RESOURCE_COMMENT_MAX_LENGTH}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    autoFocus={autoFocus}
                    className="resize-none"
                    // guests get the auth modal instead of an editable field
                    onFocus={(event) => {
                        if (!onRequireAuth()) {
                            event.currentTarget.blur()
                        }
                    }}
                />
            </TextField>
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={cn(
                        "text-xs",
                        atLimit ? "font-medium text-danger" : "text-muted",
                    )}
                >
                    {t("resourceHub.comments.counter", {
                        count: text.length,
                        limit: RESOURCE_COMMENT_MAX_LENGTH,
                    })}
                </span>
                {submitFailed ? (
                    <span role="alert" className="text-xs text-danger">
                        {t("resourceHub.comments.submitError")}
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
