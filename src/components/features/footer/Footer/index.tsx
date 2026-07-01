"use client"

import React from "react"
import {
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    FaFacebook,
    FaLinkedin,
    FaGithub,
} from "react-icons/fa6"
import {
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "@/i18n/navigation"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    CONTACT_EMAIL,
    FOUNDER_FACEBOOK,
    FOUNDER_GITHUB,
    FOUNDER_LINKEDIN,
} from "@/components/features/contact/Contact/constants"
import {
    FooterNavColumn,
} from "./FooterNavColumn"
import { BrandLogo } from "@/components/blocks/identity/BrandLogo"

/** Founder social links (brand logos → react-icons/fa6 per the icon rule). */
const SOCIALS = [
    { key: "facebook", href: FOUNDER_FACEBOOK, icon: FaFacebook },
    { key: "linkedin", href: FOUNDER_LINKEDIN, icon: FaLinkedin },
    { key: "github", href: FOUNDER_GITHUB, icon: FaGithub },
] as const

/** Props for {@link Footer}. */
export type FooterProps = WithClassNames<undefined>

/**
 * Global site footer (editorial-minimal). A single flat band separated from the
 * page by a top border — never a card. Brand lockup + manifesto + founder socials
 * on the left; two quiet link columns (explore · support) on the right; a bottom
 * bar with copyright, the "built by" credit, and the legal stubs.
 *
 * Pure composition: blocks (`BrandLogo`) + the locale-aware router + real route
 * helpers / contact constants. Hidden on the reader/auth shells by the caller
 * ({@link InnerLayout}).
 *
 * @param props - optional className (placement only).
 */
export const Footer = ({ className }: FooterProps) => {
    const t = useTranslations()
    const router = useRouter()
    const paths = pathConfig().locale()
    const year = new Date().getFullYear()

    const exploreLinks = [
        { key: "courses", label: t("footer.links.courses"), path: paths.course().build() },
        { key: "blog", label: t("footer.links.blog"), path: paths.blog().build() },
        { key: "talents", label: t("footer.links.talents"), path: paths.talents().build() },
        { key: "community", label: t("footer.links.community"), path: paths.community().build() },
    ]
    const supportLinks = [
        { key: "contact", label: t("footer.links.contact"), path: paths.contact().build() },
        { key: "email", label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    ]

    return (
        <footer className={cn("border-t border-default bg-surface", className)}>
            <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                {/* top: brand+manifesto+socials (left) · link columns (right) */}
                <div className="flex flex-col justify-between gap-10 md:flex-row">
                    <div className="flex max-w-sm flex-col gap-4">
                        <BrandLogo />
                        <Typography type="body-sm" color="muted">
                            {t("footer.tagline")}
                        </Typography>
                        <div className="flex items-center gap-3">
                            {SOCIALS.map(({ key, href, icon: Icon }) => (
                                <Link
                                    key={key}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={t(`contact.founder.${key}`)}
                                    className="text-muted transition-colors hover:text-foreground"
                                >
                                    <Icon className="size-5" aria-hidden />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-12 sm:gap-16">
                        <FooterNavColumn title={t("footer.exploreTitle")} links={exploreLinks} />
                        <FooterNavColumn title={t("footer.supportTitle")} links={supportLinks} />
                    </div>
                </div>

                {/* bottom bar: copyright + credit (left) · legal stubs (right) */}
                <div className="mt-10 flex flex-col gap-3 border-t border-default pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <Typography type="body-xs" color="muted">
                        {t("footer.copyright", { year })} · {t("footer.madeBy")}
                    </Typography>
                    <div className="flex items-center gap-4">
                        <Link
                            onPress={() => router.push(paths.terms().build())}
                            className="cursor-pointer text-xs text-muted transition-colors hover:text-foreground"
                        >
                            {t("footer.links.terms")}
                        </Link>
                        <Link
                            onPress={() => router.push(paths.privacy().build())}
                            className="cursor-pointer text-xs text-muted transition-colors hover:text-foreground"
                        >
                            {t("footer.links.privacy")}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
