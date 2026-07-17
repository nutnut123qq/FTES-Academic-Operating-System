"use client"

import React, {
    useEffect,
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
    PaletteIcon,
} from "@phosphor-icons/react"
import {
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "@/i18n/navigation"
import {
    Logo,
} from "./Logo"
import {
    HeaderNav,
} from "./HeaderNav"
import {
    AccountMenuDropdown,
} from "./AccountMenuDropdown"
import {
    useAppNav,
} from "@/components/features/app-shell/useAppNav"
import {
    SearchInline,
} from "./SearchInline"
import {
    NotificationBell,
} from "./NotificationBell"
import {
    CartButton,
} from "./CartButton"
import {
    LanguageDropdown,
} from "./LanguageDropdown"
import { useNavbarBottomLayerStore } from "@/hooks/zustand/navbarBottomLayer/store"
import {
    useAppearanceOverlayState,
    useSearchOverlayState,
} from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link Navbar}.
 */
export type NavbarProps = WithClassNames<undefined>

/**
 * Navbar — top application navigation bar (the ONLY global nav surface — no
 * global left sidebar exists anywhere).
 *
 * Container: owns the Ctrl/Cmd+K search shortcut + the mobile drawer state and
 * composes the logo, the 5-module {@link HeaderNav}, search trigger (full field
 * on desktop, icon on mobile), the standalone language dropdown, the appearance
 * settings button, notifications, the account menu, and a mobile expand button that opens
 * a navigation drawer mirroring the same 5 modules as PLAIN LINK ROWS from the
 * shared {@link useAppNav} source (no accordion, no nested children). `"use client"`
 * for hooks + keyboard handling.
 * @param props - optional root class name (placement only)
 */
export const Navbar = ({ className }: NavbarProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { open: openSearch } = useSearchOverlayState()
    const { open: openAppearance } = useAppearanceOverlayState()
    const [isDrawerOpen, setDrawerOpen] = useState(false)
    // same primary-nav source HeaderNav renders on desktop — no drift
    const modules = useAppNav()
    // optional second layer (e.g. profile tabs) a page registered into the navbar
    const bottomLayer = useNavbarBottomLayerStore((state) => state.bottomLayer)

    /** Open the mobile navigation drawer. */
    const openDrawer = () => {
        setDrawerOpen(true)
    }

    /** Navigate to a drawer destination and dismiss the drawer. */
    const goFromDrawer = (path: string) => {
        router.push(path)
        setDrawerOpen(false)
    }

    // Single source of the global Ctrl/Cmd+K shortcut (the overlay no longer registers
    // its own) — it always opens the centered search command palette, on every viewport.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            // some keydown events (IME composition, autofill) fire with no `key`
            const isK = event.key?.toLowerCase() === "k"
            if (!isK) return
            if (!(event.ctrlKey || event.metaKey)) return
            // Skip when some OTHER overlay (auth/confirm modal, a drawer…) is on top so the
            // shortcut never stacks the search popup over an open dialog. The search
            // popup's own dialog carries `data-search-overlay`.
            const foreignOverlay = Array.from(
                document.querySelectorAll(".modal__dialog, .drawer__dialog"),
            ).some((node) => !node.hasAttribute("data-search-overlay"))
            if (foreignOverlay) return
            event.preventDefault()
            openSearch()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [openSearch])

    return (
        <header className={cn("sticky top-0 z-50 border-b border-separator bg-background", className)}>
            {/* primary row — fixed 4rem tall; the header root owns the single bottom border */}
            <div className="flex h-16 min-h-16 w-full items-center justify-between gap-3 px-3">
                <div className="flex items-center gap-6">
                    <Logo className="justify-start" />
                    <HeaderNav />
                </div>

                <div className="flex items-center justify-end gap-2">
                    {/* desktop: field-shaped trigger that opens the command palette; mobile: just an icon */}
                    <SearchInline />
                    <Button
                        isIconOnly
                        variant="tertiary"
                        aria-label={t("search.label")}
                        className="md:hidden"
                        onPress={openSearch}
                    >
                        <SearchIcon className="size-5" />
                    </Button>
                    {/* desktop: language + appearance settings inline; on mobile they move into the drawer */}
                    <div className="hidden items-center gap-2 md:flex">
                        <LanguageDropdown />
                        <Button
                            isIconOnly
                            variant="tertiary"
                            aria-label={t("appearance.title")}
                            onPress={openAppearance}
                        >
                            <PaletteIcon className="size-5" aria-hidden focusable="false" />
                        </Button>
                    </div>
                    <CartButton />
                    <NotificationBell />
                    <AccountMenuDropdown />
                    {/* mobile: expand icon → navigation drawer */}
                    <Button
                        isIconOnly
                        variant="ghost"
                        aria-label={t("nav.mobileMenu")}
                        className="md:hidden"
                        onPress={openDrawer}
                    >
                        <MenuIcon className="size-5" />
                    </Button>
                </div>
            </div>

            {/* page-registered secondary layer (e.g. profile tabs). It sits flush
                under the primary row with NO divider of its own — the header root's
                single border-b falls under whichever layer is last (single → row,
                bottomLayer → this), so there is always exactly one navbar border. */}
            {bottomLayer ? <div className="w-full">{bottomLayer}</div> : null}

            {/* mobile navigation drawer (opened by the expand icon) — mirrors the
                desktop 5 modules as plain link rows (no accordion, no children) */}
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
                                    {modules.map((module) => (
                                        <Button
                                            key={module.key}
                                            variant={module.isActive ? "secondary" : "ghost"}
                                            fullWidth
                                            className="justify-start gap-2"
                                            onPress={() => goFromDrawer(module.path)}
                                        >
                                            <span aria-hidden>{module.icon}</span>
                                            {module.label}
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
                                        {/* close the containing drawer BEFORE opening the
                                            global modal — never stack overlays */}
                                        <Button
                                            isIconOnly
                                            variant="tertiary"
                                            aria-label={t("appearance.title")}
                                            onPress={() => {
                                                setDrawerOpen(false)
                                                openAppearance()
                                            }}
                                        >
                                            <PaletteIcon className="size-5" aria-hidden focusable="false" />
                                        </Button>
                                    </div>
                                </div>
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </Drawer>
        </header>
    )
}
