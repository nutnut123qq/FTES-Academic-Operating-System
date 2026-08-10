"use client"

import { useMediaQuery } from "usehooks-ts"
import { useCommunityLiveChatSse } from "@/hooks/sse/useCommunityLiveChatSse"
import { useCommunityLiveChatOverlayState } from "@/hooks/zustand/overlay/hooks"

/** Tailwind `xl` breakpoint (1280px). */
const XL_QUERY = "(min-width: 1280px)"

/**
 * Owns the SINGLE community live-chat SSE connection for the community surface (so
 * two surfaces — the xl rail + the < xl floating panel — never open two streams).
 * Renders `null`; mounted once by the community shell.
 *
 * Streams while the chat is actually being viewed:
 * - `xl+`: the rail is visible on every community page → stream + heartbeat run while
 *   the shell is mounted.
 * - `< xl`: only while the floating panel (`communityLiveChat` overlay) is open.
 *
 * The lifecycle hook additionally gates on `keycloak.authenticated`, so a signed-out
 * viewer never opens a stream.
 */
export const CommunityLiveChatSse = () => {
    const isDesktop = useMediaQuery(XL_QUERY)
    const { isOpen } = useCommunityLiveChatOverlayState()
    useCommunityLiveChatSse(isDesktop || isOpen)
    return null
}
