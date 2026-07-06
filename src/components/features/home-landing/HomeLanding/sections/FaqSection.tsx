"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { TruthList } from "@/components/blocks/marketing/TruthList"
import { FAQ_KEYS } from "../content"

/** How many questions show before "show more" reveals the rest (checklist STT 27). */
const FAQ_VISIBLE = 5

/**
 * FTES FAQ — real questions & answers derived from the offer/policy content, rendered
 * with the {@link TruthList} accordion shape (HeroUI `variant="surface"`, no indicator).
 * The mandatory refund Q&A leads. Every question AND answer is passed as text, so the
 * copy exists in the DOM regardless of expanded state (crawlable).
 */
export const FaqSection = () => {
    const t = useTranslations("homeLanding")
    const [expanded, setExpanded] = useState(false)
    const items = FAQ_KEYS.map((key) => ({
        truth: t(`faq.items.${key}.q`),
        fix: t(`faq.items.${key}.a`),
    }))
    // Show a representative few by default; "show more" reveals the full set.
    const hasMore = items.length > FAQ_VISIBLE
    const visibleItems = expanded ? items : items.slice(0, FAQ_VISIBLE)
    return (
        <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
                <Typography type="body-sm" color="muted">
                    {t("faq.eyebrow")}
                </Typography>
                <Typography type="h3" weight="bold">
                    {t("faq.title")}
                </Typography>
            </div>
            <TruthList items={visibleItems} />
            {hasMore ? (
                <div className="mt-6 flex justify-center">
                    <Button
                        variant="secondary"
                        onPress={() => setExpanded((prev) => !prev)}
                    >
                        {expanded ? t("faq.showLess") : t("faq.showMore")}
                        {expanded ? (
                            <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                        ) : (
                            <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                        )}
                    </Button>
                </div>
            ) : null}
        </section>
    )
}
