"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { TruthList } from "@/components/blocks/marketing/TruthList"
import { FAQ_KEYS } from "../content"

/**
 * FTES FAQ — real questions & answers derived from the offer/policy content, rendered
 * with the {@link TruthList} accordion shape (HeroUI `variant="surface"`, no indicator).
 * The mandatory refund Q&A leads. Every question AND answer is passed as text, so the
 * copy exists in the DOM regardless of expanded state (crawlable).
 */
export const FaqSection = () => {
    const t = useTranslations("homeLanding")
    const items = FAQ_KEYS.map((key) => ({
        truth: t(`faq.items.${key}.q`),
        fix: t(`faq.items.${key}.a`),
    }))
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
            <TruthList items={items} />
        </section>
    )
}
