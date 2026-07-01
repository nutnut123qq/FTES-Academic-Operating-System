"use client"

import React, {
    useEffect,
    useMemo,
    useState,
} from "react"
import {
    Button,
    Drawer,
    Typography,
    cn,
} from "@heroui/react"
import {
    SidebarSimpleIcon as MenuIcon,
    MagnifyingGlassIcon as SearchIcon,
} from "@phosphor-icons/react"
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
} from "./types"
import {
    Logo,
} from "./Logo"
import {
    AccountMenuDropdown,
} from "./AccountMenuDropdown"
import {
    NavLinks,
} from "./NavLinks"
import {
    SearchButton,
} from "./SearchButton"
import {
    NotificationBell,
} from "./NotificationBell"
import {
    LanguageDropdown,
} from "./LanguageDropdown"
import {
    DarkLightModeSwitch,
} from "./AccountMenuDropdown/DarkLightModeSwitch"
import { useNavbarBottomLayerStore } from "@/hooks/zustand/navbarBottomLayer/store"
import { useSearchOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link Navbar}.
 */
export type NavbarProps = WithClassNames<undefined>

/**
 * Navbar — top application navigation bar.
 *
 * Container: owns the Ctrl/Cmd+K search shortcut + the mobile drawer state and
 * composes the logo, nav links, search trigger (full field on desktop, icon on
 * mobile), the standalone language dropdown, the theme switch, notifications,
 * the account menu, and a mobile expand button that opens a navigation drawer.
 * `"use client"` for hooks + keyboard handling.
 * @param props - optional root class name (placement only)
 */
export const Navbar = ({ className }: NavbarProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const { open: openSearch } = useSearchOverlayState()
    const [isDrawerOpen, setDrawerOpen] = useState(false)
    // optional second layer (e.g. profile tabs) a page registered into the navbar
    const bottomLayer = useNavbarBottomLayerStore((state) => state.bottomLayer)

    // register the global Ctrl/Cmd+K shortcut to open the search overlay
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            // some keydown events (IME composition, autofill) fire with no `key`
            const isK = event.key?.toLowerCase() === "k"
            if (!isK) return
            if (!(event.ctrlKey || event.metaKey)) return
            event.preventDefault()
            openSearch()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [openSearch])

    // mobile drawer nav entries (same targets as the desktop NavLinks)
    const mobileNavItems = useMemo<Array<NavbarItem>>(
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
        [locale, pathname, t],
    )

    return (
        <nav className={cn("sticky top-0 z-50 border-b border-separator bg-background", className)}>
            {/* primary row — fixed 4rem tall; the nav root owns the single bottom border */}
            <div className="flex h-16 min-h-16 w-full items-center justify-between gap-3 px-3">
                <div className="flex items-center gap-6">
                    <Logo className="justify-start" />
                    <NavLinks />
                </div>

                <div className="flex items-center justify-end gap-2">
                    {/* desktop: full input-style search; mobile: just an icon */}
                    <SearchButton className="hidden w-[260px] md:flex" />
                    <Button
                        isIconOnly
                        variant="tertiary"
                        aria-label={t("search.label")}
                        className="md:hidden"
                        onPress={openSearch}
                    >
                        <SearchIcon className="size-5" />
                    </Button>
                    {/* desktop: language + theme inline; on mobile they move into the drawer */}
                    <div className="hidden items-center gap-2 md:flex">
                        <LanguageDropdown />
                        <DarkLightModeSwitch />
                    </div>
                    <NotificationBell />
                    <AccountMenuDropdown />
                    {/* mobile: expand icon → navigation drawer */}
                    <Button
                        isIconOnly
                        variant="ghost"
                        aria-label={t("nav.mobileMenu")}
                        className="md:hidden"
                        onPress={() => setDrawerOpen(true)}
                    >
                        <MenuIcon className="size-5" />
                    </Button>
                </div>
            </div>

            {/* page-registered secondary layer (e.g. profile tabs). It sits flush
                under the primary row with NO divider of its own — the nav root's
                single border-b falls under whichever layer is last (single → row,
                bottomLayer → this), so there is always exactly one navbar border. */}
            {bottomLayer ? <div className="w-full">{bottomLayer}</div> : null}

            {/* mobile navigation drawer (opened by the expand icon) */}
            <Drawer>
                <Drawer.Backdrop isOpen={isDrawerOpen} onOpenChange={setDrawerOpen}>
                    <Drawer.Content placement="right">
                        <Drawer.Dialog className="flex h-full flex-col">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>{t("nav.mobileMenu")}</Drawer.Heading>
                            </Drawer.Header>
                            <Drawer.Body className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    {mobileNavItems.map((item) => (
                                        <Button
                                            key={item.path}
                                            variant={item.isActive ? "secondary" : "ghost"}
                                            fullWidth
                                            className="justify-start"
                                            onPress={() => {
                                                router.push(item.path)
                                                setDrawerOpen(false)
                                            }}
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </div>
                                {/* controls hidden from the mobile bar live here: language + theme */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <Typography type="body-sm">
                                            {t("nav.toggleLanguage")}
                                        </Typography>
                                        <LanguageDropdown />
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <Typography type="body-sm">
                                            {t("nav.appearance")}
                                        </Typography>
                                        <DarkLightModeSwitch />
                                    </div>
                                </div>
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </Drawer>
        </nav>
    )
}
