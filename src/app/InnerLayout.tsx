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
import { SseSideEffects } from "@/hooks/sse/SseSideEffects"
import { SwrSideEffects } from "@/hooks/swr/SwrSideEffects"
import { ReduxProvider } from "@/redux/ReduxProvider"
import { ModalContainer } from "@/components/modals/ModalContainer"
import { UseEffects } from "@/hooks/effects/UseEffects"
import { AuthQueryOpener } from "@/components/layouts/auth/AuthQueryOpener"
import { TourProvider } from "@/components/features/onboarding"
import { useAppearanceStore } from "@/hooks/zustand/appearance/store"

export const InnerLayout = ({ children }: PropsWithChildren) => {
    // Ambient meteor background runs app-wide as a FAINT backdrop texture (its
    // opacity is low enough — see `meteorFall` in globals.css — that the streaks
    // read as ambient light behind the glassmorphism cards, not painted on top).
    // Suppressed on CONTENT-DENSE routes — Learn, Community and the Subject
    // workspace — where the moving streaks cross the reading area and read as
    // "painted on top of" the info cards (checklist STT 2). Everywhere else
    // (landing / home / decorative pages) it still shows behind content.
    const pathname = usePathname()
    const isContentRoute = /\/(?:learn|community|subjects)(?:\/|$)/.test(pathname ?? "")
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
    // Footer hiện ở LANDING — cả locale root ("/", "/vi", "/en") LẪN /home ("/home",
    // "/vi/home"): /home là bản ungated của CÙNG trang landing (user đã login xem ở đây).
    // Mọi trang khác (dashboard / learn / profile / auth / …) KHÔNG có footer — thầy chốt 2026-06-26.
    const footerPath = pathname ?? ""
    const showFooter = /^\/(?:[a-z]{2})?\/?$/.test(footerPath) || /^\/(?:[a-z]{2}\/)?home\/?$/.test(footerPath)
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
                            <SseSideEffects />
                            <UseEffects />
                            {/* `?auth=signin|signup` deep link → opens the auth modal (needs its
                                own Suspense: useSearchParams) */}
                            <Suspense fallback={null}>
                                <AuthQueryOpener />
                            </Suspense>
                            <AppSplash />
                            <TopLoader />
                            {!isContentRoute && effectEnabled ? (
                                <AmbientBackground direction={effectDirection} speed={effectSpeed} />
                            ) : null}
                            {/* Onboarding tour engine — wraps the shell so it can spotlight the
                                Navbar anchors and the account-menu replay entry shares its context.
                                The overlay itself renders in a body-level portal. */}
                            <TourProvider>
                                <Navbar />
                                <ModalContainer />
                                <DrawerContainer />
                                <div>{children}</div>
                                {showFooter ? <Footer /> : null}
                            </TourProvider>
                            <CookieConsentBanner />
                            <ToastProvider />
                        </SwrProvider>
                    </ReduxProvider>
                </HeroUIProvider>
            </NextThemesProvider>
        </Suspense>
    )
}