"use client"

import { useEffect } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { useLinkGithubOverlayState } from "@/hooks/zustand/overlay/hooks"

/** Session-storage key marking that the soft GitHub-link prompt already fired this session. */
const SESSION_PROMPT_KEY = "linkGithubPrompted"

/** Props for {@link GithubLinkGate}. */
export type GithubLinkGateProps = WithClassNames<undefined>

/**
 * Soft gate that nudges authenticated learners to link their GitHub account.
 *
 * Rendered inside the learn layout. When the signed-in user has no `githubUsername`, it opens
 * the global {@link LinkGithubModal} once per browser session (soft: the user may close it and
 * keep learning; it re-prompts on the next session). Renders nothing — className is accepted
 * for API conformance but not applied.
 * @param props - {@link GithubLinkGateProps}
 */
export const GithubLinkGate = ({ className }: GithubLinkGateProps) => {
    // className accepted for API conformance; this component renders null (side-effect only)
    void className
    // only authenticated users can link; unauthenticated visitors never see the prompt
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    // the resolved current user — carries githubUsername once the `me` query populates it
    const user = useAppSelector((state) => state.user.user)
    // global overlay handle for the link-GitHub modal (rendered by ModalContainer)
    const { setOpen } = useLinkGithubOverlayState()

    useEffect(() => {
        // wait until we actually know who the user is before deciding to prompt
        if (!authenticated || !user) {
            return
        }
        // already linked → nothing to do
        if (user.githubUsername) {
            return
        }
        // guard against SSR where sessionStorage is unavailable
        if (typeof window === "undefined") {
            return
        }
        // soft behaviour: prompt at most once per session so closing it isn't nagging
        if (window.sessionStorage.getItem(SESSION_PROMPT_KEY)) {
            return
        }
        // mark first so a re-render (or fast unmount/mount) can't double-open the modal
        window.sessionStorage.setItem(SESSION_PROMPT_KEY, "1")
        // open the link-GitHub modal
        setOpen(true)
    }, [
        authenticated,
        user,
        setOpen,
    ])

    return null
}
