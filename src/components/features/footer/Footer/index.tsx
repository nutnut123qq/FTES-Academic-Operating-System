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
import { FooterNavColumn } from "./FooterNavColumn"

/** Kênh mạng xã hội chính thức. FTES ĐÃ mở kênh riêng cho YouTube/TikTok — chủ box chốt
 *  2026-08-13: `@ftes-edu` (YouTube) và `@ftes_vn` (TikTok). Thay cho ghi chú cũ 2026-07-28
 *  ("vẫn là kênh FunnyCode, cố ý") — quyết định đó đã hết hiệu lực, ĐỪNG revert về @funnycode. */
const SOCIALS = [
    { key: "facebook", href: "https://www.facebook.com/ftes.edu/", Icon: FacebookLogoIcon },
    { key: "youtube", href: "https://www.youtube.com/@ftes-edu", Icon: YoutubeLogoIcon },
    { key: "tiktok", href: "https://www.tiktok.com/@ftes_vn", Icon: TiktokLogoIcon },
] as const

/** Props for {@link Footer}. */
export type FooterProps = WithClassNames<undefined>

/**
 * Global site footer (editorial-minimal) — a single flat band with a top border.
 * 3 cột trên desktop (thương hiệu · pháp lý · pháp nhân), dồn 1 cột trên mobile;
 * bottom bar chỉ còn copyright. Chỉ link tới route đã tồn tại (/terms, /privacy).
 *
 * @param props - optional className (placement only).
 */
export const Footer = ({ className }: FooterProps) => {
    const t = useTranslations()
    const paths = pathConfig().locale()
    const year = new Date().getFullYear()

    // Nhóm link pháp lý — chỉ 2 trang stub đang có route thật; thêm route mới thì bổ sung ở đây.
    const legalLinks = [
        { key: "terms", label: t("footer.links.termsFull"), path: paths.terms().build() },
        { key: "privacy", label: t("footer.links.privacyFull"), path: paths.privacy().build() },
    ]

    return (
        <footer className={cn("border-t border-default bg-surface", className)}>
            <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
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

                    {/* pháp lý — cột link tới các trang điều khoản/chính sách đã có route */}
                    <FooterNavColumn
                        title={t("footer.legalTitle")}
                        links={legalLinks}
                    />

                    {/* pháp nhân — tên/MST/ngày thành lập/ngành nghề nguyên văn theo footer ftes.vn.
                        Địa chỉ · email · điện thoại CHƯA render: chưa có dữ liệu thật, mà footer là
                        mặt tiền toàn site nên thà thiếu còn hơn phơi "(cần điền)". Có số thật trên
                        giấy phép thì thêm 3 dòng vào đây (email/phone nên là mailto:/tel:). */}
                    <div className="flex max-w-sm flex-col gap-3">
                        <Typography type="body-sm" weight="semibold">
                            {t("footer.companyTitle")}
                        </Typography>
                        <div className="flex flex-col gap-2">
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
                </div>

                {/* bottom bar: chỉ copyright (link pháp lý đã nằm ở cột trên) */}
                <div className="mt-10 border-t border-default pt-6">
                    <Typography type="body-xs" color="muted">
                        {t("footer.copyright", { year })}
                    </Typography>
                </div>
            </div>
        </footer>
    )
}
