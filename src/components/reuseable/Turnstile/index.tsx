"use client"

import React, { useEffect, useRef } from "react"
import { cn } from "@heroui/react"
import { publicEnv } from "@/resources/env/public"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface TurnstileProps extends WithClassNames<undefined> {
    /** Callback triggered when Turnstile successfully validates the visitor. */
    onVerify: (token: string) => void
    /** Callback triggered when Turnstile token expires. */
    onExpire?: () => void
    /** Callback triggered on network or verification error. */
    onError?: () => void
}

/** Render options passed to `turnstile.render()`. */
interface TurnstileRenderOptions {
    sitekey: string
    callback: (token: string) => void
    "expired-callback": () => void
    "error-callback": () => void
}

/** Minimal subset of the Cloudflare Turnstile global API used in this module. */
interface TurnstileApi {
    render: (container: HTMLElement, options: TurnstileRenderOptions) => string
    remove: (widgetId: string) => void
}

/** Window augmented with the optional Turnstile global. */
interface WindowWithTurnstile extends Window {
    turnstile?: TurnstileApi
}

/**
 * Renders the Cloudflare Turnstile captcha widget dynamically.
 * Automatically loads the Turnstile script if not already present.
 * No-ops (returns null) when captcha is disabled in public config.
 */
export const Turnstile = ({ onVerify, onExpire, onError, className }: TurnstileProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)

    useEffect(() => {
        const { enabled, siteKey } = publicEnv().captcha
        if (!enabled) return

        let isMounted = true

        const renderWidget = () => {
            const turnstile = (window as WindowWithTurnstile).turnstile
            if (!isMounted || !containerRef.current || !turnstile) return

            try {
                if (widgetIdRef.current !== null) {
                    turnstile.remove(widgetIdRef.current)
                }

                widgetIdRef.current = turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    callback: (token: string) => {
                        if (isMounted) onVerify(token)
                    },
                    "expired-callback": () => {
                        if (isMounted && onExpire) onExpire()
                    },
                    "error-callback": () => {
                        if (isMounted && onError) onError()
                    },
                })
            } catch (err) {
                console.error("[Turnstile] Render error:", err)
            }
        }

        const scriptId = "cloudflare-turnstile-script"
        let script = document.getElementById(scriptId) as HTMLScriptElement | null

        if (!script) {
            script = document.createElement("script")
            script.id = scriptId
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            script.async = true
            script.defer = true
            document.body.appendChild(script)
        }

        const turnstile = (window as WindowWithTurnstile).turnstile
        if (turnstile) {
            renderWidget()
        } else {
            const handleLoad = () => {
                renderWidget()
            }
            script.addEventListener("load", handleLoad)
            return () => {
                isMounted = false
                script?.removeEventListener("load", handleLoad)
                const activeTurnstile = (window as WindowWithTurnstile).turnstile
                if (widgetIdRef.current !== null && activeTurnstile) {
                    activeTurnstile.remove(widgetIdRef.current)
                }
            }
        }

        return () => {
            isMounted = false
            const activeTurnstile = (window as WindowWithTurnstile).turnstile
            if (widgetIdRef.current !== null && activeTurnstile) {
                activeTurnstile.remove(widgetIdRef.current)
            }
        }
    }, [onVerify, onExpire, onError])

    const { enabled } = publicEnv().captcha
    if (!enabled) return null

    return <div ref={containerRef} className={cn("flex justify-center my-2 min-h-[74px]", className)} />
}
export default Turnstile
