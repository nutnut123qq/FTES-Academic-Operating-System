"use client"

import type { IconComponent } from "@/types"
import { GlobeIcon as TranslateIcon, PaintBrushIcon } from "@phosphor-icons/react"
import React, { useMemo, useState } from "react"
import {
    Link,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import {
    DarkLightModeSwitch,
} from "../AccountMenuDropdown/DarkLightModeSwitch"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * One entry rendered in the mobile navigation menu.
 */
export interface MobileNavItem {
    /** Visible label. */
    label: string
    /** Navigation target path. */
    path: string
    /** Whether this entry matches the active route. */
    isActive: boolean
    /** Icon component rendered next to the label. */
    icon: IconComponent
}

/**
 * Props for {@link MobileNavbar}.
 */
export type MobileNavbarProps = WithClassNames<undefined>

/**
 * MobileNavbar — full-screen navigation menu shown on small screens.
 *
 * Container: derives nav entries + active-route state from the router/locale
 * itself, manages its own open/close state, and self-navigates on item press.
 * `"use client"` for the interactive theme switch + hooks + press handlers.
 * @param props - optional root class name
 */
export const MobileNavbar = ({ className }: MobileNavbarProps) => {
    const t = useTranslations()
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const navItems = useMemo<Array<MobileNavItem>>(
        () => [
            {
                label: t("nav.home"),
                path: pathConfig().locale().home().build(),
                isActive: pathname === "/" || pathname === pathConfig().locale().home().build(),
                icon: () => null,
            },
            {
                label: t("nav.courses"),
                path: pathConfig().locale().course().build(),
                isActive: pathname.startsWith(pathConfig().locale(locale).course().build()),
                icon: () => null,
            },
            {
                label: t("nav.contact"),
                path: pathConfig().locale().contact().build(),
                isActive: pathname.startsWith(pathConfig().locale(locale).contact().build()),
                icon: () => null,
            },
        ],
        [locale, pathname, t],
    )

    if (!isMenuOpen) return null

    return (
        <nav
            className={cn("backdrop-blur-xl bg-background/80 flex flex-col h-[calc(100vh-64px)] pb-10", className)}
            aria-label={t("nav.mobileMenu")}
        >
            <div className="flex flex-col gap-1.5 mt-4 flex-grow">
                {navItems.map((item, index) => (
                    <div key={`${item.path}-${index}`} className="w-full">
                        <Link
                            className={cn(
                                "w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300",
                                item.isActive
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "hover:bg-default-100",
                            )}
                            onPress={() => {
                                router.push(item.path)
                                setIsMenuOpen(false)
                            }}
                        >
                            <item.icon className="size-6" />
                            <span className="font-bold tracking-tight">{item.label}</span>
                        </Link>
                    </div>
                ))}
            </div>

            <div className="mt-auto flex flex-col gap-6 pt-6 border-t">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-default-100 flex items-center justify-center">
                            <PaintBrushIcon className="size-5" />
                        </div>
                        <div className="flex flex-col gap-0">
                            <span className="text-sm font-bold">{t("nav.appearance")}</span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                                System theme
                            </span>
                        </div>
                    </div>
                    <DarkLightModeSwitch />
                </div>
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-default-100 flex items-center justify-center">
                            <TranslateIcon className="size-5" />
                        </div>
                        <div className="flex flex-col gap-0">
                            <span className="text-sm font-bold">
                                {t("nav.toggleLanguage")}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                                {locale === "en" ? "English" : "Tiếng Việt"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
