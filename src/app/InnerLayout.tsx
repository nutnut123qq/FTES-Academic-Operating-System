"use client"
import { Navbar } from "@/components/features/navbar/Navbar"
import { Footer } from "@/components/features/footer/Footer"
import { ToastProvider } from "@heroui/react"
import React, { PropsWithChildren, Suspense } from "react"
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
import { AppSidebar } from "@/components/features/app-shell/AppSidebar"

export const InnerLayout = ({ children }: PropsWithChildren) => {
    // Suppress the drifting ember background on Learn routes — it competes with
    // long-form reading. Keep it on marketing / dashboard / the rest of the app.
    const pathname = usePathname()
    const isLearnRoute = pathname?.includes("/learn") ?? false
    // Footer hiện ở LANDING — cả locale root ("/", "/vi", "/en") LẪN /home ("/home",
    // "/vi/home"): /home là bản ungated của CÙNG trang landing (user đã login xem ở đây).
    // Mọi trang khác (dashboard / learn / profile / auth / …) KHÔNG có footer — thầy chốt 2026-06-26.
    const footerPath = pathname ?? ""
    const showFooter = /^\/(?:[a-z]{2})?\/?$/.test(footerPath) || /^\/(?:[a-z]{2}\/)?home\/?$/.test(footerPath)
    // Global primary sidebar (archetype A) on app pages. Hidden on: landing/home
    // (marketing, has footer), auth, learn (own left rail), and subject-workspace
    // detail (own left rail) — so we never stack two rails.
    const isAuthRoute = footerPath.includes("/authentication")
    const isSubjectDetail = /^\/(?:[a-z]{2}\/)?subjects\/[^/]+/.test(footerPath)
    const showAppSidebar = !showFooter && !isAuthRoute && !isLearnRoute && !isSubjectDetail
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
                            <AppSplash />
                            <TopLoader />
                            {!isLearnRoute ? <AmbientBackground /> : null}
                            <Navbar />
                            <SocketConnectionStatus />
                            <ModalContainer />
                            <DrawerContainer />
                            {showAppSidebar ? (
                                <div className="flex w-full">
                                    <AppSidebar />
                                    <div className="min-w-0 flex-1">{children}</div>
                                </div>
                            ) : (
                                <div>{children}</div>
                            )}
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