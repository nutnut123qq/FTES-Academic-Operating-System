"use client"

import React, {
    useEffect,
    useState,
} from "react"
import {
    Accordion,
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
    SearchButton,
} from "./SearchButton"
import {
    NotificationBell,
} from "./NotificationBell"
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
 * composes the logo, the 4-module {@link HeaderNav}, search trigger (full field
 * on desktop, icon on mobile), the standalone language dropdown, the appearance
 * settings button, notifications, the account menu, and a mobile expand button that opens
 * a navigation drawer mirroring the same 4 modules (Home link + accordion
 * groups from the shared {@link useAppNav} source). `"use client"` for hooks +
 * keyboard handling.
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
    // drawer accordion state — seeded with the active module on each open
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
    // optional second layer (e.g. profile tabs) a page registered into the navbar
    const bottomLayer = useNavbarBottomLayerStore((state) => state.bottomLayer)

    const homeModule = modules.find((module) => module.children.length === 0)
    const groupModules = modules.filter((module) => module.children.length > 0)

    /** Open the drawer with the group containing the active route pre-expanded. */
    const openDrawer = () => {
        const activeModule = groupModules.find((module) => module.isActive)
        setExpandedKeys(new Set(activeModule ? [activeModule.key] : []))
        setDrawerOpen(true)
    }

    /** Navigate to a drawer destination and dismiss the drawer. */
    const goFromDrawer = (path: string) => {
        router.push(path)
        setDrawerOpen(false)
    }

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

    return (
        <header className={cn("sticky top-0 z-50 border-b border-separator bg-background", className)}>
            {/* primary row — fixed 4rem tall; the header root owns the single bottom border */}
            <div className="flex h-16 min-h-16 w-full items-center justify-between gap-3 px-3">
                <div className="flex items-center gap-6">
                    <Logo className="justify-start" />
                    <HeaderNav />
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
                desktop 4 modules: Home link row + one accordion group per module */}
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
                                    {homeModule ? (
                                        <Button
                                            variant={homeModule.isActive ? "secondary" : "ghost"}
                                            fullWidth
                                            className="justify-start gap-2"
                                            onPress={() => goFromDrawer(homeModule.path)}
                                        >
                                            <span aria-hidden>{homeModule.icon}</span>
                                            {homeModule.label}
                                        </Button>
                                    ) : null}
                                    <Accordion
                                        variant="default"
                                        className="w-full min-w-0"
                                        expandedKeys={expandedKeys}
                                        onExpandedChange={(keys) =>
                                            setExpandedKeys(new Set([...keys].map(String)))
                                        }
                                    >
                                        {groupModules.map((module) => (
                                            <Accordion.Item
                                                key={module.key}
                                                id={module.key}
                                                aria-label={module.label}
                                                className="min-w-0"
                                            >
                                                <Accordion.Heading className="min-w-0">
                                                    <Accordion.Trigger className="w-full min-w-0 px-2 py-2 hover:bg-transparent">
                                                        <div className="flex w-full min-w-0 items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    module.isActive ? "text-accent" : "text-muted",
                                                                )}
                                                                aria-hidden
                                                            >
                                                                {module.icon}
                                                            </span>
                                                            <Typography
                                                                type="body"
                                                                weight="semibold"
                                                                className={cn(
                                                                    "min-w-0 flex-1",
                                                                    module.isActive && "text-accent",
                                                                )}
                                                            >
                                                                {module.label}
                                                            </Typography>
                                                            <Accordion.Indicator className="shrink-0" />
                                                        </div>
                                                    </Accordion.Trigger>
                                                </Accordion.Heading>
                                                <Accordion.Panel>
                                                    <Accordion.Body className="px-0 pb-3">
                                                        <div className="flex flex-col gap-2">
                                                            {module.children.map((item) => (
                                                                <Button
                                                                    key={item.key}
                                                                    variant={item.isActive ? "secondary" : "ghost"}
                                                                    fullWidth
                                                                    className="justify-start gap-2"
                                                                    onPress={() => goFromDrawer(item.path)}
                                                                >
                                                                    <span aria-hidden>{item.icon}</span>
                                                                    {item.label}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Panel>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion>
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
