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
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { BrandLogo } from "@/components/blocks/identity/BrandLogo"

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
                <div className="flex max-w-sm flex-col gap-4">
                    <BrandLogo />
                    <Typography type="body-sm" color="muted">
                        {t("footer.tagline")}
                    </Typography>
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
