"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { ArrowLeftIcon, SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"

/** Props for {@link PracticeAiHandoff}. */
export interface PracticeAiHandoffProps {
    /** Heading of the module the learner opened. */
    title: string
    /** Why the module is empty (the missing BE bank). */
    description: string
    /** Label of the CTA that hands the learner over to the AI tab. */
    ctaLabel: string
    /** Opens the subject's AI tools tab. */
    onOpenAiTools: () => void
    /** Back to the practice hub. */
    onBack: () => void
}

/**
 * Placeholder for a practice module whose BACKEND bank does not exist yet
 * (curated quiz sets / curated flashcard decks). Instead of a dead "coming soon"
 * card, it hands the learner over to the subject's AI tools tab, where the AI Quiz /
 * AI Flashcards generators produce the same practice material from real subject
 * resources.
 */
export const PracticeAiHandoff = ({
    title,
    description,
    ctaLabel,
    onOpenAiTools,
    onBack,
}: PracticeAiHandoffProps) => {
    const t = useTranslations("subjects")

    return (
        <div className="flex flex-col gap-4 p-6">
            <Button size="sm" variant="tertiary" className="self-start" onPress={onBack}>
                <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                {t("practice.backToHub")}
            </Button>
            <EmptyContent
                icon={<SparkleIcon aria-hidden focusable="false" className="size-8 text-muted" />}
                title={title}
                description={description}
                action={
                    <Button size="sm" variant="primary" onPress={onOpenAiTools}>
                        <SparkleIcon aria-hidden focusable="false" className="size-4" />
                        {ctaLabel}
                    </Button>
                }
            />
            <Typography type="body-xs" color="muted" align="center">
                {t("practice.aiHandoffHint")}
            </Typography>
        </div>
    )
}
