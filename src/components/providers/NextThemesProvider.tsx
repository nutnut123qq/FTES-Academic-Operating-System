"use client"
import React from "react"
import { ThemeProvider } from "next-themes"

import { type ThemeProviderProps } from "next-themes"

/**
 * Theme provider wrapper mounted at the very top of {@link import("@/app/InnerLayout").InnerLayout}.
 *
 * `next-themes` is imported STATICALLY on purpose. It used to come in through
 * `next/dynamic(..., { ssr: false })`, and because this provider wraps the WHOLE
 * app tree, that one flag made the entire application bail out of server
 * rendering: every route shipped a body of ~280 bytes plus ~320KB of inline
 * script, and nothing at all — navbar, page chrome, loading skeletons — painted
 * until ~1.7MB of JavaScript had downloaded, parsed and hydrated. That is the
 * "blank white page for a few seconds" the deployed app was filmed doing.
 * (Measured on the live deploy: `<!--$!--><template data-dgst=
 * "BAILOUT_TO_CLIENT_SIDE_RENDERING">` in the HTML of `/en`, `/en/subjects`,
 * `/en/community` and `/en/blog` alike; the dev server spells the cause out as
 * "Bail out to client-side rendering: next/dynamic".)
 *
 * `ThemeProvider` is server-renderable — it renders its children plus the
 * pre-paint `<script>` that stamps the theme class on `<html>` before first
 * paint. The one thing it needs in return is `suppressHydrationWarning` on the
 * `<html>` element (set in `app/[locale]/layout.tsx`), since that script mutates
 * the tag before React hydrates.
 */
export const NextThemesProvider = ({ children, ...props }: ThemeProviderProps) => {
    return <ThemeProvider {...props}>{children}</ThemeProvider>
}
