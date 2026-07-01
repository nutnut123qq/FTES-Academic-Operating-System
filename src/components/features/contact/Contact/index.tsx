"use client"

import React from "react"
import {
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { ContactChannels } from "./ContactChannels"
import { ContactForm } from "./ContactForm"
import { ContactFaq } from "./ContactFaq"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { PageContainer } from "@/components/blocks/layout/PageContainer"
import { PageHeader } from "@/components/blocks/layout/PageHeader"

/** Props for {@link Contact}. */
export type ContactProps = WithClassNames<undefined>

/**
 * Contact page (`/[locale]/contact`). Founder-led routing: a header with an honest
 * response-time line, the real direct channels + founder card on the left, a
 * working message form (emailed to the team) on the right, and a contact-specific
 * FAQ that deflects + cross-links the funnel FAQ. Pure composition — blocks +
 * features only, no styling (placement classes only).
 *
 * @param props - optional className (placement only).
 */
export const Contact = ({ className }: ContactProps) => {
    const t = useTranslations()
    return (
        <PageContainer className={className}>
            <div className="flex flex-col gap-10">
                {/* header: title + intro + honest response-time expectation */}
                <div className="flex flex-col gap-2">
                    <PageHeader
                        title={t("contact.title")}
                        description={t("contact.intro")}
                    />
                    <Typography type="body-sm" color="muted">
                        {t("contact.responseTime")}
                    </Typography>
                </div>

                {/* left: real channels + founder · right: the working form */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <ContactChannels />
                    <LabeledCard label={t("contact.form.title")}>
                        <ContactForm />
                    </LabeledCard>
                </div>

                {/* deflect: contact-specific FAQ + link to the funnel FAQ */}
                <ContactFaq />
            </div>
        </PageContainer>
    )
}
