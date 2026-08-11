"use client"

import React, { useMemo } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { ArrowClockwiseIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRequireAuth } from "@/hooks/useRequireAuth"

/**
 * Why a comment thread failed to load. The thread used to collapse every failure
 * into ONE line ("Không tải được bình luận") plus a Retry button, so a viewer
 * could not tell a dropped connection (retry helps) from an expired session or a
 * private-group post (retry can never help) — the same conflation the community
 * feed already fixed at the feed level with its `isAuthGate` branch.
 */
export type CommentLoadErrorKind =
    | "auth"
    | "forbidden"
    | "notFound"
    | "network"
    | "server"
    | "unknown"

/** `communityHub.*` message key per kind (the viewer-facing explanation). */
const MESSAGE_KEY: Record<CommentLoadErrorKind, string> = {
    auth: "engagement.commentsLoadFailedAuth",
    forbidden: "engagement.commentsLoadFailedForbidden",
    notFound: "engagement.commentsLoadFailedNotFound",
    network: "engagement.commentsLoadFailedNetwork",
    server: "engagement.commentsLoadFailedServer",
    unknown: "engagement.commentsLoadFailed",
}

/** Kinds where pressing "Thử lại" can actually change the outcome. */
const RETRYABLE: ReadonlySet<CommentLoadErrorKind> = new Set<CommentLoadErrorKind>([
    "network",
    "server",
    "unknown",
])

/** Map an HTTP status onto a kind (shared by the Apollo + REST shapes). */
const fromStatus = (status: number): CommentLoadErrorKind => {
    if (status === 401) {
        return "auth"
    }
    if (status === 403) {
        return "forbidden"
    }
    if (status === 404 || status === 410) {
        return "notFound"
    }
    if (status >= 500) {
        return "server"
    }
    return "unknown"
}

/**
 * HTTP status carried by the rejection, whichever stack raised it: Apollo v4
 * `ServerError`/`ServerParseError` (`statusCode`), the REST client's `RestError`
 * (`status`), or a v3-style wrapped `networkError`. Duck-typed on purpose —
 * mirrors the feed's own gate detection and keeps this module free of an
 * `@apollo/client` import.
 */
const statusOf = (error: unknown): number | undefined => {
    if (!error || typeof error !== "object") {
        return undefined
    }
    const candidate = error as {
        statusCode?: unknown
        status?: unknown
        networkError?: { statusCode?: unknown; status?: unknown } | null
    }
    const raw =
        candidate.statusCode
        ?? candidate.status
        ?? candidate.networkError?.statusCode
        ?? candidate.networkError?.status
    return typeof raw === "number" ? raw : undefined
}

/**
 * The GraphQL `errors[]` of a rejected operation — Apollo v4 raises
 * `CombinedGraphQLErrors` (`errors`), v3 wrapped them as `graphQLErrors`. The BE
 * resolver stamps `extensions.code` (`COMMUNITY_POST_NOT_FOUND`,
 * `COMMUNITY_NOT_GROUP_MEMBER`, `GRAPHQL_INTERNAL_ERROR`…) and Spring GraphQL adds
 * `extensions.classification` (FORBIDDEN / NOT_FOUND / INTERNAL_ERROR).
 */
const graphQLErrorsOf = (
    error: unknown,
): ReadonlyArray<{ message?: string; extensions?: Record<string, unknown> | null }> => {
    if (!error || typeof error !== "object") {
        return []
    }
    const candidate = error as {
        errors?: unknown
        graphQLErrors?: unknown
    }
    const list = Array.isArray(candidate.errors)
        ? candidate.errors
        : Array.isArray(candidate.graphQLErrors)
            ? candidate.graphQLErrors
            : []
    return list as ReadonlyArray<{ message?: string; extensions?: Record<string, unknown> | null }>
}

/**
 * Classify a comment-read rejection so the thread can say WHY it failed and only
 * offer a retry that can succeed.
 *
 * Order matters: the transport status wins (the gateway answers a missing/expired
 * token with a top-level HTTP 401 `PLATFORM_UNAUTHORIZED` envelope that never
 * reaches GraphQL), then the GraphQL error code, then the offline flag, and only
 * then a message sniff for stacks that carry neither.
 *
 * @param error - the rejection stored by SWR (any thrown value).
 * @returns the kind driving the message + whether a retry is offered.
 */
export const classifyCommentLoadError = (error: unknown): CommentLoadErrorKind => {
    if (!error) {
        return "unknown"
    }

    const status = statusOf(error)
    if (status !== undefined) {
        return fromStatus(status)
    }

    const [first] = graphQLErrorsOf(error)
    if (first) {
        const code = String(first.extensions?.code ?? "")
        const classification = String(first.extensions?.classification ?? "")
        if (/UNAUTHENTICATED|UNAUTHORIZED|TOKEN|SESSION/.test(code) || classification === "UNAUTHORIZED") {
            return "auth"
        }
        if (classification === "FORBIDDEN" || /FORBIDDEN|NOT_GROUP_MEMBER|DENIED/.test(code)) {
            return "forbidden"
        }
        if (classification === "NOT_FOUND" || /NOT_FOUND/.test(code)) {
            return "notFound"
        }
        if (classification === "INTERNAL_ERROR" || /INTERNAL/.test(code)) {
            return "server"
        }
        return "unknown"
    }

    // A request that never left the device (offline tab, killed radio) is a network
    // failure no matter what the thrown value looks like.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return "network"
    }

    const text = [
        (error as { message?: unknown }).message,
        (error as { bodyText?: unknown }).bodyText,
    ]
        .filter((part): part is string => typeof part === "string")
        .join(" ")
    if (/PLATFORM_UNAUTHORIZED|UNAUTHENTICATED|Unauthorized|\b401\b/.test(text)) {
        return "auth"
    }
    if (/\b403\b|Forbidden/.test(text)) {
        return "forbidden"
    }
    if (/\b404\b|NOT_FOUND|not found/i.test(text)) {
        return "notFound"
    }
    if (/Failed to fetch|NetworkError|network error|ERR_(INTERNET|NETWORK)|timed? ?out|aborted/i.test(text)) {
        return "network"
    }
    return "unknown"
}

/** Props for {@link CommentLoadError}. */
export interface CommentLoadErrorProps {
    /** The SWR rejection. Omitted / unrecognized → the generic message, retry offered. */
    error?: unknown
    /** Re-attempt the fetch in place; the button only renders when a retry can help. */
    onRetry?: () => void
    /** Extra classes for the wrapper. */
    className?: string
}

/**
 * Inline "couldn't load the comments" block: ONE localized line that names the
 * actual cause, plus the action that can fix it — "Thử lại" for a transient
 * failure (network / server / unrecognized), "Đăng nhập" for a guest, and NEITHER
 * for a permission or deleted-post failure where both would only lie.
 *
 * A signed-in viewer whose token expired mid-read (the access token is short
 * lived, and the comment fetch is lazy — it fires when the thread is expanded,
 * often long after the page loaded) gets the session-expired wording AND a retry,
 * because the client refreshes the token before the next attempt.
 *
 * @param props - {@link CommentLoadErrorProps}
 */
export const CommentLoadError = ({ error, onRetry, className }: CommentLoadErrorProps) => {
    const t = useTranslations("communityHub")
    const { authenticated, requireAuth } = useRequireAuth()
    const kind = useMemo(() => classifyCommentLoadError(error), [error])

    const isExpiredSession = kind === "auth" && authenticated
    const messageKey = isExpiredSession
        ? "engagement.commentsLoadFailedSessionExpired"
        : MESSAGE_KEY[kind]
    const canRetry = Boolean(onRetry) && (RETRYABLE.has(kind) || isExpiredSession)

    return (
        <div className={cn("flex flex-col items-start gap-2", className)}>
            <Typography type="body-sm" color="muted">
                {t(messageKey)}
            </Typography>
            {kind === "auth" && !authenticated ? (
                <Button
                    size="sm"
                    variant="primary"
                    onPress={() => requireAuth("auth.context.comment")}
                >
                    {t("engagement.commentsSignIn")}
                </Button>
            ) : null}
            {canRetry && onRetry ? (
                <Button size="sm" variant="secondary" onPress={onRetry}>
                    <ArrowClockwiseIcon aria-hidden focusable="false" className="size-4" />
                    {t("engagement.retry")}
                </Button>
            ) : null}
        </div>
    )
}
