"use client"

import React from "react"
import {
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "@/i18n/navigation"
import {
    pathConfig,
} from "@/resources/path"
import {
    FacebookLogoIcon,
    TiktokLogoIcon,
    YoutubeLogoIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { BrandLogo } from "@/components/blocks/identity/BrandLogo"

/** Kênh mạng xã hội chính thức (chủ box cung cấp 2026-07-28). YouTube/TikTok vẫn là kênh
 *  FunnyCode — cố ý, FTES chưa mở kênh riêng. */
const SOCIALS = [
    { key: "facebook", href: "https://www.facebook.com/ftes.edu/", Icon: FacebookLogoIcon },
    { key: "youtube", href: "https://www.youtube.com/@funnycode", Icon: YoutubeLogoIcon },
    { key: "tiktok", href: "https://www.tiktok.com/@funnycode_vn", Icon: TiktokLogoIcon },
] as const

/** Props for {@link Footer}. */
export type FooterProps = WithClassNames<undefined>

/**
 * Global site footer (editorial-minimal) — a single flat band with a top border.
 * Skeleton version: brand lockup + tagline on the left, the legal stubs + copyright
 * below. Feature-specific link columns / founder socials were stripped with the
 * detail pages; add new columns back as the project grows.
 *
 * @param props - optional className (placement only).
 */
export const Footer = ({ className }: FooterProps) => {
    const t = useTranslations()
    const router = useRouter()
    const paths = pathConfig().locale()
    const year = new Date().getFullYear()

    return (
        <footer className={cn("border-t border-default bg-surface", className)}>
            <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
                    {/* brand: logo + slogan 2 dòng + kênh mạng xã hội */}
                    <div className="flex max-w-sm flex-col gap-4">
                        {/* logo TRÁI — slogan 2 dòng NGAY BÊN PHẢI, khớp lockup của ftes.vn */}
                        <div className="flex flex-row items-center gap-3">
                            <BrandLogo />
                            {/* leading-snug: mặc định của Typography body giãn ~56px/dòng, khối 2 dòng
                                cao gấp 3 lần logo → lockup lệch so với ftes.vn. */}
                            <div className="flex flex-col leading-snug">
                                <Typography type="body" weight="medium" className="whitespace-nowrap leading-snug">
                                    {t("footer.slogan.line1")}
                                </Typography>
                                <Typography type="body" color="muted" className="whitespace-nowrap leading-snug">
                                    {t("footer.slogan.line2")}
                                </Typography>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {SOCIALS.map(({ key, href, Icon }) => (
                                <Link
                                    key={key}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={t(`footer.social.${key}`)}
                                    className="text-muted transition-colors hover:text-foreground"
                                >
                                    <Icon className="size-6" aria-hidden focusable="false" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* pháp nhân — nguyên văn theo footer ftes.vn đang chạy */}
                    <div className="flex max-w-sm flex-col gap-2">
                        <Typography type="body-sm" weight="medium">
                            {t("footer.company.name")}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("footer.company.taxId")}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("footer.company.founded")}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("footer.company.field")}
                        </Typography>
                    </div>
                </div>

                {/* bottom bar: copyright (left) · legal stubs (right) */}
                <div className="mt-10 flex flex-col gap-3 border-t border-default pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <Typography type="body-xs" color="muted">
                        {t("footer.copyright", { year })}
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
