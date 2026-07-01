"use client"

import React from "react"
import {
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    EnvelopeSimpleIcon,
    PhoneIcon,
    ClockIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { FounderCard } from "./FounderCard"
import {
    CONTACT_EMAIL,
    CONTACT_PHONE,
    CONTACT_PHONE_TEL,
} from "../constants"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"

/** Props for {@link ContactChannels}. */
export type ContactChannelsProps = WithClassNames<undefined>

/**
 * Left rail of the contact page: the real direct channels (email · phone · support
 * hours) plus the founder card. Static, honest data — no fake form, no fabricated
 * office. Self-contained (reads its own constants + i18n).
 *
 * @param props - optional className (placement only).
 */
export const ContactChannels = ({ className }: ContactChannelsProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <LabeledCard label={t("contact.direct.title")}>
                <div className="flex flex-col gap-4">
                    {/* email */}
                    <div className="flex items-center gap-3">
                        <IconTile icon={<EnvelopeSimpleIcon />} tone="accent" size="sm" />
                        <div className="flex min-w-0 flex-col">
                            <Typography type="body-xs" color="muted">
                                {t("contact.direct.emailLabel")}
                            </Typography>
                            <Link href={`mailto:${CONTACT_EMAIL}`}>
                                {CONTACT_EMAIL}
                            </Link>
                        </div>
                    </div>
                    {/* phone */}
                    <div className="flex items-center gap-3">
                        <IconTile icon={<PhoneIcon />} tone="success" size="sm" />
                        <div className="flex min-w-0 flex-col">
                            <Typography type="body-xs" color="muted">
                                {t("contact.direct.phoneLabel")}
                            </Typography>
                            <Link href={`tel:${CONTACT_PHONE_TEL}`}>
                                {CONTACT_PHONE}
                            </Link>
                        </div>
                    </div>
                    {/* support hours (static) */}
                    <div className="flex items-center gap-3">
                        <IconTile icon={<ClockIcon />} tone="warning" size="sm" />
                        <div className="flex min-w-0 flex-col">
                            <Typography type="body-xs" color="muted">
                                {t("contact.direct.hoursLabel")}
                            </Typography>
                            <Typography type="body-sm">
                                {t("contact.direct.hoursValue")}
                            </Typography>
                        </div>
                    </div>
                </div>
            </LabeledCard>

            <FounderCard />
        </div>
    )
}
