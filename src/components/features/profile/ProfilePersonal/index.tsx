"use client"

import React, { useMemo } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import {
    CaretRightIcon,
    EnvelopeIcon,
    GlobeIcon,
    MapPinIcon,
    PhoneIcon,
} from "@phosphor-icons/react"
import { FaGithub, FaLinkedin } from "react-icons/fa6"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryProfilePersonalSwr, type SocialLink } from "../hooks/useQueryProfilePersonalSwr"

/** Social link presentation: icon + display URL + full href. */
interface SocialMeta {
    icon: React.ReactNode
    href: string
    label: string
}

/** Build a safe external href and a compact display label for a social link. */
const buildSocialMeta = (social: SocialLink): SocialMeta => {
    if (social.key === "email") {
        return {
            icon: <EnvelopeIcon className="size-5" aria-hidden focusable="false" />,
            href: `mailto:${social.value}`,
            label: social.value,
        }
    }

    const url = /^https?:\/\//i.test(social.value) ? social.value : `https://${social.value}`
    let host = ""
    try {
        host = new URL(url).hostname.replace(/^www\./, "")
    } catch {
        host = social.value
    }

    switch (social.key) {
    case "github":
        return {
            icon: <FaGithub className="size-5" aria-hidden focusable="false" />,
            href: url,
            label: host,
        }
    case "linkedin":
        return {
            icon: <FaLinkedin className="size-5" aria-hidden focusable="false" />,
            href: url,
            label: host,
        }
    case "website":
    default:
        return {
            icon: <GlobeIcon className="size-5" aria-hidden focusable="false" />,
            href: url,
            label: host,
        }
    }
}

/** One contact row: icon + value + optional href. */
interface ContactRow {
    key: "email" | "phone" | "address"
    icon: React.ReactNode
    value: string
    href?: string
}

/** Skeleton mirroring the About + Contact + Social links cards. */
const PersonalSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.Card lines={3} />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
        </div>
    </div>
)

/**
 * Personal section of the profile (§2). Redesigned into two labeled cards:
 * "About" and "Social links", with brand icons + hover states.
 */
export const ProfilePersonal = () => {
    const t = useTranslations()
    const router = useRouter()
    const { detail, isLoading, error } = useQueryProfilePersonalSwr()

    const socials = useMemo(() => (detail?.socials ?? []).map(buildSocialMeta), [detail?.socials])

    const contactRows: Array<ContactRow> = useMemo(() => {
        if (!detail) return []
        const rows: Array<ContactRow> = []
        if (detail.contact.email) {
            rows.push({
                key: "email",
                icon: <EnvelopeIcon className="size-5" aria-hidden focusable="false" />,
                value: detail.contact.email,
                href: `mailto:${detail.contact.email}`,
            })
        }
        if (detail.contact.phone) {
            rows.push({
                key: "phone",
                icon: <PhoneIcon className="size-5" aria-hidden focusable="false" />,
                value: detail.contact.phone,
                href: `tel:${detail.contact.phone.replace(/\s/g, "")}`,
            })
        }
        if (detail.contact.address) {
            rows.push({
                key: "address",
                icon: <MapPinIcon className="size-5" aria-hidden focusable="false" />,
                value: detail.contact.address,
            })
        }
        return rows
    }, [detail])

    return (
        <AsyncContent
            isLoading={isLoading && !detail}
            skeleton={<PersonalSkeleton />}
            error={!detail ? error : undefined}
            errorContent={{
                title: t("profile.loadingError"),
                retryLabel: t("profile.retry"),
                onRetry: () => {
                    void router.refresh()
                },
            }}
        >
            {detail ? (
                <div className="flex flex-col gap-6">
                    <LabeledCard label={t("profile.personal.about")}>
                        {detail.about ? (
                            <Typography type="body-sm" color="muted">
                                {detail.about}
                            </Typography>
                        ) : (
                            <EmptyContent title={t("profile.personal.empty.aboutTitle")} />
                        )}
                    </LabeledCard>

                    <LabeledCard label={t("profile.personal.contact.title")}>
                        {contactRows.length === 0 ? (
                            <EmptyContent title={t("profile.personal.empty.contactTitle")} />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {contactRows.map((row) => (
                                    <div
                                        key={row.key}
                                        className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                                    >
                                        <span className="text-muted">{row.icon}</span>
                                        {row.href ? (
                                            <a
                                                href={row.href}
                                                className="text-sm font-medium text-accent no-underline hover:underline"
                                            >
                                                {row.value}
                                            </a>
                                        ) : (
                                            <Typography type="body-sm" className="text-foreground">
                                                {row.value}
                                            </Typography>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </LabeledCard>

                    <LabeledCard label={t("profile.personal.socials")}>
                        {socials.length === 0 ? (
                            <EmptyContent title={t("profile.personal.empty.socialsTitle")} />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {socials.map((social, index) => {
                                    const key = `${detail.socials[index]?.key}-${index}`
                                    return (
                                        <a
                                            key={key}
                                            href={social.href}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="group flex items-center gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors hover:bg-surface-secondary"
                                            aria-label={social.href}
                                        >
                                            <span className="text-muted">{social.icon}</span>
                                            <Typography
                                                type="body-sm"
                                                weight="medium"
                                                className="min-w-0 flex-1"
                                                truncate
                                            >
                                                {social.label}
                                            </Typography>
                                            <CaretRightIcon
                                                className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        </a>
                                    )
                                })}
                            </div>
                        )}
                    </LabeledCard>
                </div>
            ) : null}
        </AsyncContent>
    )
}
