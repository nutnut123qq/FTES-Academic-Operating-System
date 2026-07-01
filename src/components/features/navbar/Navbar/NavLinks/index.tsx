"use client"

import React, {
    useMemo,
} from "react"
import {
    Link,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    usePathname,
    useRouter,
} from "@/i18n/navigation"
import {
    pathConfig,
} from "@/resources/path"
import type {
    NavbarItem,
} from "../types"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link NavLinks}.
 */
export type NavLinksProps = WithClassNames<undefined>

/**
 * Desktop navbar link group (hidden on small screens).
 *
 * Container: derives its entries + active-route state from the router/locale
 * itself and self-navigates on press. `"use client"` for the hooks + press
 * handlers.
 * @param props - optional root class name
 */
export const NavLinks = ({ className }: NavLinksProps) => {
    const t = useTranslations()
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()

    const items = useMemo<Array<NavbarItem>>(
        () => [
            {
                label: t("nav.home"),
                path: pathConfig().locale().home().build(),
                isActive: pathname === "/" || pathname === pathConfig().locale().home().build(),
            },
            {
                label: t("nav.courses"),
                path: pathConfig().locale().course().build(),
                isActive: pathname.startsWith(pathConfig().locale(locale).course().build()),
            },
            {
                label: t("nav.contact"),
                path: pathConfig().locale().contact().build(),
                isActive: pathname.startsWith(pathConfig().locale(locale).contact().build()),
            },
        ],
        [
            locale,
            pathname,
            t,
        ],
    )

    return (
        <div className={cn("hidden flex-1 items-center justify-center gap-1.5 md:flex", className)}>
            {items.map((item) => (
                <Link key={item.path} onPress={() => router.push(item.path)}>
                    <span
                        className={cn(
                            "whitespace-nowrap rounded-full px-3 py-2 text-sm transition-colors",
                            item.isActive
                                ? "bg-accent/10 text-accent"
                                : "text-muted hover:text-foreground",
                        )}
                    >
                        {item.label}
                    </span>
                </Link>
            ))}
        </div>
    )
}
