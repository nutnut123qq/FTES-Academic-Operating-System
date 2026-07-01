"use client"

import React from "react"
import {
    Link,
    Typography,
} from "@heroui/react"
import {
    FaFacebook,
    FaLinkedin,
    FaGithub,
} from "react-icons/fa6"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    FOUNDER_FACEBOOK,
    FOUNDER_GITHUB,
    FOUNDER_LINKEDIN,
} from "../../constants"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"

/** Props for {@link FounderCard}. */
export type FounderCardProps = WithClassNames<undefined>

/** Founder social links (brand logos → react-icons/fa6 per the icon rule). */
const SOCIALS = [
    { key: "facebook", href: FOUNDER_FACEBOOK, icon: FaFacebook },
    { key: "linkedin", href: FOUNDER_LINKEDIN, icon: FaLinkedin },
    { key: "github", href: FOUNDER_GITHUB, icon: FaGithub },
] as const

/**
 * Founder mini-card — StarCi is founder-led, so the page names the person and
 * links straight to them. Static (the socials are real, fixed URLs). Anchors the
 * "reach the founder" route for partnership / press.
 *
 * @param props - optional className (placement only).
 */
export const FounderCard = ({ className }: FounderCardProps) => {
    const t = useTranslations()
    return (
        <LabeledCard label={t("contact.founder.title")} className={className}>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                    <Typography type="body" weight="semibold">
                        {t("contact.founder.name")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("contact.founder.role")}
                    </Typography>
                </div>
                <div className="flex items-center gap-3">
                    {SOCIALS.map(({ key, href, icon: Icon }) => (
                        <Link
                            key={key}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t(`contact.founder.${key}`)}
                        >
                            <Icon className="size-5" aria-hidden />
                        </Link>
                    ))}
                </div>
            </div>
        </LabeledCard>
    )
}
