"use client"
import { Navbar } from "@/components/features/navbar/Navbar"
import { Footer } from "@/components/features/footer/Footer"
import { ToastProvider } from "@heroui/react"
import React, { PropsWithChildren, Suspense, useEffect } from "react"
import { CookieConsentBanner } from "@/components/features/cookie-consent/CookieConsentBanner"
import { usePathname } from "next/navigation"
import { HeroUIProvider } from "@/components/providers/HeroUIProvider"
import { NextThemesProvider } from "@/components/providers/NextThemesProvider"
import { SwrProvider } from "@/components/providers/SwrProvider"
import { DrawerContainer } from "@/components/drawers/DrawerContainer"
import { AmbientBackground } from "@/components/blocks/layout/AmbientBackground"
import { TopLoader } from "@/components/blocks/layout/TopLoader"
import { AppSplash } from "@/components/blocks/layout/AppSplash"
import { SocketConnectionStatus } from "@/components/blocks/layout/SocketConnectionStatus"
import { SocketIoSideEffects } from "@/hooks/socketio/SocketIoSideEffects"
import { SwrSideEffects } from "@/hooks/swr/SwrSideEffects"
import { ReduxProvider } from "@/redux/ReduxProvider"
import { ModalContainer } from "@/components/modals/ModalContainer"
import { UseEffects } from "@/hooks/effects/UseEffects"
import { AuthQueryOpener } from "@/components/layouts/auth/AuthQueryOpener"
import { useAppearanceStore } from "@/hooks/zustand/appearance/store"

export const InnerLayout = ({ children }: PropsWithChildren) => {
    // The meteor background is a full-screen fixed layer, so on any content-dense
    // page its streaks show over/through the (glassmorphism, translucent) cards and
    // read as painted on top. There's no per-page mask that fits every layout —
    // content width/position varies (landing = centered max-w-6xl, workspace/
    // community = full-bleed with rails). So gate it to the SPACIOUS landing pages
    // only (same set that shows the footer: "/", "/home", per-locale), where the
    // hero has room for it; every other route (app shells, learn, auth…) gets none.
    // To let another page show it, add its path test to `isAmbientRoute`.
    const pathname = usePathname()
    // Ambient effect config (appearance-settings) — narrow selectors so InnerLayout
    // only re-renders when these two fields change (a rare user action).
    const effectEnabled = useAppearanceStore((state) => state.effectEnabled)
    const effectDirection = useAppearanceStore((state) => state.effectDirection)
    const effectSpeed = useAppearanceStore((state) => state.effectSpeed)
    // The store persists with `skipHydration` (server markup == first client render,
    // no hydration mismatch); pull the saved config right after mount. The sparks
    // start at opacity 0 and only fade in after ~1s, so the swap is imperceptible.
    useEffect(() => {
        void useAppearanceStore.persist.rehydrate()
    }, [])
    // LANDING = locale root ("/", "/vi", "/en") HOẶC /home ("/home", "/vi/home"):
    // /home là bản ungated của CÙNG trang landing (user đã login xem ở đây).
    // Footer + ambient meteor CHỈ hiện ở đây; mọi trang app dày nội dung (workspace /
    // community / course / profile / learn / auth …) không có — thầy chốt 2026-06-26,
    // ambient gate 2026-07-03. Thêm trang muốn có ambient → thêm test vào đây.
    const routePath = pathname ?? ""
    const isLandingRoute =
        /^\/(?:[a-z]{2})?\/?$/.test(routePath) || /^\/(?:[a-z]{2}\/)?home\/?$/.test(routePath)
    const showFooter = isLandingRoute
    // Header-first shell (2026-07-02): global nav lives in the top bar (HeaderNav).
    // The left sidebar is reserved for in-context nav — the subject workspace rail
    // (its own `SubjectWorkspaceShell`), so InnerLayout renders content full-width.
    return (
        <Suspense>
            <NextThemesProvider 
                attribute="class" 
                defaultTheme="dark" 
                enableSystem={true} 
                storageKey="ftesaos-theme"
            >
                <HeroUIProvider>
                    <ReduxProvider>
                        <SwrProvider>
                            <SwrSideEffects />
                            <SocketIoSideEffects />
                            <UseEffects />
                            {/* `?auth=signin|signup` deep link → opens the auth modal (needs its
                                own Suspense: useSearchParams) */}
                            <Suspense fallback={null}>
                                <AuthQueryOpener />
                            </Suspense>
                            <AppSplash />
                            <TopLoader />
                            {isLandingRoute && effectEnabled ? (
                                <AmbientBackground direction={effectDirection} speed={effectSpeed} />
                            ) : null}
                            <Navbar />
                            <SocketConnectionStatus />
                            <ModalContainer />
                            <DrawerContainer />
                            <div>{children}</div>
                            {showFooter ? <Footer /> : null}
                            <CookieConsentBanner />
                            <ToastProvider />
                        </SwrProvider>
                    </ReduxProvider>
                </HeroUIProvider>
            </NextThemesProvider>
        </Suspense>
    )
}