"use client"

import React, { useCallback, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { toLocalInputValue } from "./logic"

/** Editable shape of a group event (create + edit share it). Times are `datetime-local`. */
export interface EventFormValues {
    title: string
    description: string
    location: string
    /** `YYYY-MM-DDTHH:mm` in the viewer's timezone. */
    startsAtLocal: string
    /** `YYYY-MM-DDTHH:mm` in the viewer's timezone; `""` when open-ended. */
    endsAtLocal: string
}

/** Props for {@link EventForm}. */
export interface EventFormProps {
    /** Prefill — the edited event, or blanks when creating. */
    initialValues?: {
        title: string
        description: string
        location?: string
        startsAt: string
        endsAt?: string
    }
    /** Label of the submit button (already localized). */
    submitLabel: string
    /** Runs the write; resolve `true` to let the form reset/close. */
    onSubmit: (values: EventFormValues) => Promise<boolean>
    /** Close without writing. */
    onCancel: () => void
}

/** Shared field styling — mirrors the hand-rolled inputs in the Discussion composer. */
const FIELD_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/**
 * Group event composer/editor — title, description, optional location, and the
 * start/end schedule as native `datetime-local` fields. Title, description and start
 * are required (they are `@NotBlank`/`@NotNull` on the BE `EventRequest`), so the
 * submit button stays disabled until all three are filled.
 *
 * @param props - {@link EventFormProps}
 */
export const EventForm = ({ initialValues, submitLabel, onSubmit, onCancel }: EventFormProps) => {
    const t = useTranslations("groupsHub")
    const [title, setTitle] = useState(initialValues?.title ?? "")
    const [description, setDescription] = useState(initialValues?.description ?? "")
    const [location, setLocation] = useState(initialValues?.location ?? "")
    const [startsAtLocal, setStartsAtLocal] = useState(
        toLocalInputValue(initialValues?.startsAt),
    )
    const [endsAtLocal, setEndsAtLocal] = useState(toLocalInputValue(initialValues?.endsAt))
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isValid =
        title.trim() !== "" && description.trim() !== "" && startsAtLocal.trim() !== ""

    const submit = useCallback(async () => {
        if (!isValid || isSubmitting) {
            return
        }
        setIsSubmitting(true)
        const saved = await onSubmit({
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            startsAtLocal,
            endsAtLocal,
        })
        setIsSubmitting(false)
        if (saved && initialValues == null) {
            setTitle("")
            setDescription("")
            setLocation("")
            setStartsAtLocal("")
            setEndsAtLocal("")
        }
    }, [
        description,
        endsAtLocal,
        initialValues,
        isSubmitting,
        isValid,
        location,
        onSubmit,
        startsAtLocal,
        title,
    ])

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("events.titleField")}
                aria-label={t("events.titleField")}
                className={FIELD_CLASS}
            />
            <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("events.descriptionField")}
                aria-label={t("events.descriptionField")}
                rows={3}
                className={`${FIELD_CLASS} resize-none`}
            />
            <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder={t("events.locationField")}
                aria-label={t("events.locationField")}
                className={FIELD_CLASS}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Typography type="body-xs" color="muted">
                        {t("events.startsAtField")}
                    </Typography>
                    <input
                        type="datetime-local"
                        value={startsAtLocal}
                        onChange={(event) => setStartsAtLocal(event.target.value)}
                        aria-label={t("events.startsAtField")}
                        className={FIELD_CLASS}
                    />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Typography type="body-xs" color="muted">
                        {t("events.endsAtField")}
                    </Typography>
                    <input
                        type="datetime-local"
                        value={endsAtLocal}
                        onChange={(event) => setEndsAtLocal(event.target.value)}
                        aria-label={t("events.endsAtField")}
                        className={FIELD_CLASS}
                    />
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={!isValid}
                    isPending={isSubmitting}
                    onPress={() => void submit()}
                >
                    {submitLabel}
                </Button>
                <Button size="sm" variant="ghost" isDisabled={isSubmitting} onPress={onCancel}>
                    {t("events.cancel")}
                </Button>
            </div>
        </div>
    )
}
