"use client"

import React from "react"
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    TextArea,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import { CaretDownIcon, BookOpenIcon, TextAaIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useQueryMyLearnedLessonsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyLearnedLessonsSwr"
import { fromGlobalId } from "@/modules/utils/globalId"

/** Which source a learning tool draws from. */
export type LearningInputMode = "text" | "lesson"

/** Controlled value of {@link LearningInput}. */
export interface LearningInputValue {
    /** Active source tab. */
    mode: LearningInputMode
    /** Pasted text (used when `mode === "text"`). */
    text: string
    /** Decoded raw lesson id (used when `mode === "lesson"`), or null. */
    lessonId: string | null
    /** Human label of the picked lesson, for display. */
    lessonLabel: string | null
}

/** The empty initial value for a learning tool form. */
export const emptyLearningInput: LearningInputValue = {
    mode: "text",
    text: "",
    lessonId: null,
    lessonLabel: null,
}

/**
 * The `{text}` / `{lessonId}` body fragment a learning job submit sends for the
 * current source. Sends `lessonId` when a lesson is picked (BE resolves its
 * `body_md`), otherwise the trimmed `text`.
 */
export const learningInputBody = (value: LearningInputValue): Record<string, string> => {
    if (value.mode === "lesson" && value.lessonId) return { lessonId: value.lessonId }
    return { text: value.text.trim() }
}

/** Whether the current value is submittable (has text or a picked lesson). */
export const isLearningInputReady = (value: LearningInputValue): boolean =>
    value.mode === "lesson" ? !!value.lessonId : value.text.trim().length > 0

/** Props for {@link LearningInput}. */
export interface LearningInputProps {
    /** Controlled value. */
    value: LearningInputValue
    /** Change handler. */
    onChange: (value: LearningInputValue) => void
    /** Disables all controls (while a job runs). */
    isDisabled?: boolean
}

/**
 * Shared source input for the learning tools (summary / flashcards / quiz): a two-
 * tab switch between pasting free text and picking one of the viewer's recently
 * studied lessons. The lesson list comes from `myLearnedLessons` (opaque global
 * ids decoded to the raw lesson id the job body needs). When the viewer has no
 * studied lessons the lesson tab explains that and text stays available.
 */
export const LearningInput = ({ value, onChange, isDisabled }: LearningInputProps) => {
    const t = useTranslations("aiPlatform.toolPages.input")
    const { data: lessons, isLoading } = useQueryMyLearnedLessonsSwr()

    const setMode = (mode: LearningInputMode) => onChange({ ...value, mode })

    return (
        <div className="flex flex-col gap-3">
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant={value.mode === "text" ? "primary" : "secondary"}
                    onPress={() => setMode("text")}
                    isDisabled={isDisabled}
                >
                    <TextAaIcon aria-hidden focusable="false" className="size-4" />
                    {t("modeText")}
                </Button>
                <Button
                    size="sm"
                    variant={value.mode === "lesson" ? "primary" : "secondary"}
                    onPress={() => setMode("lesson")}
                    isDisabled={isDisabled}
                >
                    <BookOpenIcon aria-hidden focusable="false" className="size-4" />
                    {t("modeLesson")}
                </Button>
            </div>

            {value.mode === "text" ? (
                <TextField variant="primary" className="w-full">
                    <TextArea
                        rows={8}
                        value={value.text}
                        onChange={(event) => onChange({ ...value, text: event.target.value })}
                        placeholder={t("textPlaceholder")}
                        className="resize-y"
                        disabled={isDisabled}
                    />
                </TextField>
            ) : (
                <div className="flex flex-col gap-2">
                    {!isLoading && (lessons?.length ?? 0) === 0 ? (
                        <Typography type="body-sm" color="muted">
                            {t("noLessons")}
                        </Typography>
                    ) : (
                        <Dropdown>
                            <DropdownTrigger
                                isDisabled={isDisabled || isLoading}
                                className={cn(
                                    "cursor-pointer rounded-2xl border border-default px-3 py-2",
                                    "flex items-center justify-between gap-2",
                                )}
                            >
                                <span className="min-w-0 truncate text-sm font-medium">
                                    {value.lessonLabel ?? t("lessonPlaceholder")}
                                </span>
                                <CaretDownIcon aria-hidden focusable="false" className="size-4 shrink-0" />
                            </DropdownTrigger>
                            <DropdownPopover className="min-w-72 max-w-96">
                                <DropdownMenu aria-label={t("lessonPlaceholder")}>
                                    {(lessons ?? []).map((lesson) => (
                                        <DropdownItem
                                            key={lesson.globalId}
                                            textValue={lesson.label}
                                            onPress={() =>
                                                onChange({
                                                    ...value,
                                                    lessonId: fromGlobalId(lesson.globalId)?.id ?? null,
                                                    lessonLabel: lesson.label,
                                                })
                                            }
                                        >
                                            <span className="line-clamp-2">{lesson.label}</span>
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </DropdownPopover>
                        </Dropdown>
                    )}
                </div>
            )}
        </div>
    )
}
