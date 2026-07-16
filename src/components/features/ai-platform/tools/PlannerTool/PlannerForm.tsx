"use client"

import React, { useState } from "react"
import { Button, Input, Label, TextArea, TextField, Typography, cn } from "@heroui/react"
import { XIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useGetAiCatalogModelsSwr } from "@/hooks/swr/api/rest/queries/useGetAiCatalogModelsSwr"
import { AiModelPicker } from "@/components/reuseable/AiModelPicker"
import type { CreateStudyPlanRequest } from "@/modules/api/rest/ai"

/** Deadline presets (days) — within the 7–180 range the spec allows. */
const DEADLINE_DAYS = [7, 14, 28, 60, 90, 180] as const
/** Hours-per-week presets. */
const HOURS_PER_WEEK = [3, 5, 8, 10, 15, 20] as const
/** Cap on topic chips per list (matches BE ≤50, kept modest for the UI). */
const MAX_TOPICS = 20

/** Props for {@link PlannerForm}. */
export interface PlannerFormProps {
    /** Submit the creation request (parent runs the long POST + spinner). */
    onSubmit: (request: CreateStudyPlanRequest) => void
    /** True while a plan is generating — disables every control. */
    isBusy: boolean
}

/**
 * The study-plan creation form: a required goal plus deadline / weekly-hours presets,
 * an optional current level, known/target topic chips, and an optional model picker.
 * Builds a {@link CreateStudyPlanRequest} and hands it to the parent, which owns the
 * long synchronous POST and the resulting plan view.
 */
export const PlannerForm = ({ onSubmit, isBusy }: PlannerFormProps) => {
    const t = useTranslations("aiPlatform.toolPages.planner")
    const locale = useLocale()
    const { data: catalog } = useGetAiCatalogModelsSwr()

    const [goal, setGoal] = useState("")
    const [deadlineDays, setDeadlineDays] = useState<number>(28)
    const [hoursPerWeek, setHoursPerWeek] = useState<number>(8)
    const [currentLevel, setCurrentLevel] = useState("")
    const [knownTopics, setKnownTopics] = useState<string[]>([])
    const [targetTopics, setTargetTopics] = useState<string[]>([])
    const [model, setModel] = useState<string | null>(null)

    const ready = goal.trim().length > 0 && !isBusy

    const submit = () => {
        if (!ready) return
        onSubmit({
            goal: goal.trim(),
            deadlineDays,
            hoursPerWeek,
            ...(currentLevel.trim() ? { currentLevel: currentLevel.trim() } : {}),
            ...(knownTopics.length ? { knownTopics } : {}),
            ...(targetTopics.length ? { targetTopics } : {}),
            language: locale,
            ...(model ? { model } : {}),
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <TextField variant="primary" className="w-full">
                    <Label className="text-sm">{t("goalLabel")}</Label>
                    <TextArea
                        rows={2}
                        value={goal}
                        onChange={(event) => setGoal(event.target.value)}
                        placeholder={t("goalPlaceholder")}
                        className="resize-y"
                        disabled={isBusy}
                    />
                </TextField>
            </div>

            <PresetRow
                label={t("deadlineLabel")}
                options={DEADLINE_DAYS}
                value={deadlineDays}
                onChange={setDeadlineDays}
                format={(days) => t("days", { count: days })}
                isDisabled={isBusy}
            />

            <PresetRow
                label={t("hoursLabel")}
                options={HOURS_PER_WEEK}
                value={hoursPerWeek}
                onChange={setHoursPerWeek}
                format={(hours) => t("hours", { count: hours })}
                isDisabled={isBusy}
            />

            <TextField variant="primary" className="w-full">
                <Label className="text-sm">{t("levelLabel")}</Label>
                <Input
                    value={currentLevel}
                    onChange={(event) => setCurrentLevel(event.target.value)}
                    placeholder={t("levelPlaceholder")}
                    disabled={isBusy}
                />
            </TextField>

            <TopicChips
                label={t("knownLabel")}
                hint={t("topicHint")}
                topics={knownTopics}
                onChange={setKnownTopics}
                isDisabled={isBusy}
            />
            <TopicChips
                label={t("targetLabel")}
                hint={t("topicHint")}
                topics={targetTopics}
                onChange={setTargetTopics}
                isDisabled={isBusy}
            />

            <div className="flex flex-col gap-2">
                <Typography type="body-sm" weight="medium">
                    {t("modelLabel")}
                </Typography>
                <AiModelPicker
                    catalog={catalog}
                    value={model}
                    onChange={setModel}
                    isDisabled={isBusy}
                    className="self-start"
                />
            </div>

            <Button variant="primary" onPress={submit} isDisabled={!ready} isPending={isBusy}>
                {isBusy ? t("generating") : t("generate")}
            </Button>
        </div>
    )
}

/** A labelled row of mutually-exclusive numeric presets (segmented buttons). */
const PresetRow = ({
    label,
    options,
    value,
    onChange,
    format,
    isDisabled,
}: {
    label: string
    options: readonly number[]
    value: number
    onChange: (value: number) => void
    format: (value: number) => string
    isDisabled?: boolean
}) => (
    <div className="flex flex-col gap-2">
        <Typography type="body-sm" weight="medium">
            {label}
        </Typography>
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <Button
                    key={option}
                    size="sm"
                    variant={value === option ? "primary" : "secondary"}
                    onPress={() => onChange(option)}
                    isDisabled={isDisabled}
                >
                    {format(option)}
                </Button>
            ))}
        </div>
    </div>
)

/** A tag input: type + Enter (or comma) to add a chip, × to remove. Dedupes and caps. */
const TopicChips = ({
    label,
    hint,
    topics,
    onChange,
    isDisabled,
}: {
    label: string
    hint: string
    topics: string[]
    onChange: (topics: string[]) => void
    isDisabled?: boolean
}) => {
    const [draft, setDraft] = useState("")

    const add = () => {
        const value = draft.trim()
        if (!value) return
        if (!topics.includes(value) && topics.length < MAX_TOPICS) {
            onChange([...topics, value])
        }
        setDraft("")
    }

    const remove = (topic: string) => onChange(topics.filter((item) => item !== topic))

    return (
        <div className="flex flex-col gap-2">
            <TextField variant="primary" className="w-full">
                <Label className="text-sm">{label}</Label>
                <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                            event.preventDefault()
                            add()
                        }
                    }}
                    onBlur={add}
                    placeholder={hint}
                    disabled={isDisabled}
                />
            </TextField>
            {topics.length ? (
                <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                        <span
                            key={topic}
                            className={cn(
                                "inline-flex items-center gap-1 rounded-full border border-default",
                                "bg-default/40 py-1 pl-3 pr-1.5 text-sm",
                            )}
                        >
                            <span className="truncate">{topic}</span>
                            <button
                                type="button"
                                aria-label={`${label}: ${topic}`}
                                onClick={() => remove(topic)}
                                disabled={isDisabled}
                                className="rounded-full p-0.5 text-muted transition-colors hover:text-danger"
                            >
                                <XIcon aria-hidden focusable="false" className="size-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
