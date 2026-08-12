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
 *
 * `gone` and `unavailable` are deliberately SEPARATE, and the split is the whole
 * point of this union rather than a nicety. They used to be one `notFound` kind
 * whose copy asserted the thing "no longer exists or was removed" — a claim only
 * the first of them earns:
 * - **`gone`** — the SERVER said the record is not there: HTTP 410, or a GraphQL
 *   error the resolver stamped (`classification: NOT_FOUND` /
 *   `COMMUNITY_POST_NOT_FOUND`). It answered about the entity, so the reader can
 *   be told it is gone, and no retry is offered because none can help.
 * - **`unavailable`** — a bare HTTP **404**, which says only that the SERVER had
 *   nothing at that URL. On a REST thread that is just as likely to be a route
 *   the running build does not serve yet (a BE that has not been deployed with
 *   the endpoint) as a deleted record — telling the reader their challenge "was
 *   removed" would be a fabrication about data that is sitting right there on the
 *   page. So the copy stops at "couldn't load", and a retry IS offered: a 404
 *   from a not-yet-deployed route starts succeeding the moment it ships.
 */
export type CommentLoadErrorKind =
    | "auth"
    | "forbidden"
    | "gone"
    | "unavailable"
    | "network"
    | "server"
    | "unknown"

/** `communityHub.*` message key per kind (the viewer-facing explanation). */
const MESSAGE_KEY: Record<CommentLoadErrorKind, string> = {
    auth: "engagement.commentsLoadFailedAuth",
    forbidden: "engagement.commentsLoadFailedForbidden",
    gone: "engagement.commentsLoadFailedNotFound",
    unavailable: "engagement.commentsLoadFailedUnavailable",
    network: "engagement.commentsLoadFailedNetwork",
    server: "engagement.commentsLoadFailedServer",
    unknown: "engagement.commentsLoadFailed",
}

/** {@link CommentThreadLabels} field a surface overrides for each kind. */
const LABEL_FIELD: Record<CommentLoadErrorKind, keyof CommentThreadLabels> = {
    auth: "loadFailedAuth",
    forbidden: "loadFailedForbidden",
    gone: "loadFailedGone",
    unavailable: "loadFailedUnavailable",
    network: "loadFailedNetwork",
    server: "loadFailedServer",
    unknown: "loadFailed",
}

/** Kinds where pressing "Thử lại" can actually change the outcome. */
const RETRYABLE: ReadonlySet<CommentLoadErrorKind> = new Set<CommentLoadErrorKind>([
    "network",
    "server",
    "unknown",
    // a 404 that is really an undeployed route succeeds as soon as it ships
    "unavailable",
])

/** Map an HTTP status onto a kind (shared by the Apollo + REST shapes). */
const fromStatus = (status: number): CommentLoadErrorKind => {
    if (status === 401) {
        return "auth"
    }
    if (status === 403) {
        return "forbidden"
    }
    // 410 is the server SAYING it is gone; 404 only says "nothing at this URL",
    // which a build without the endpoint answers exactly the same way.
    if (status === 410) {
        return "gone"
    }
    if (status === 404) {
        return "unavailable"
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
        // A GraphQL NOT_FOUND is the RESOLVER answering about the record itself
        // (it looked, and there is nothing) — unlike a bare HTTP 404, which the
        // gateway also returns for a route the build does not serve.
        if (classification === "NOT_FOUND" || /NOT_FOUND/.test(code)) {
            return "gone"
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
    // Same split as the status branch: a spelled-out `NOT_FOUND` code is the
    // server naming the record, a bare `404` is only "nothing at this URL".
    if (/NOT_FOUND/.test(text) || /not found/i.test(text)) {
        return "gone"
    }
    if (/\b404\b/.test(text)) {
        return "unavailable"
    }
    if (/Failed to fetch|NetworkError|network error|ERR_(INTERNET|NETWORK)|timed? ?out|aborted/i.test(text)) {
        return "network"
    }
    return "unknown"
}

/**
 * Per-surface copy for the thread's NON-CONVERSATION states (nothing here yet /
 * couldn't load), already translated by the caller.
 *
 * The thread is shared by the community feed, a challenge's exam paper, an FE
 * album picture and group discussions, but its default copy is written for a
 * community POST — so a challenge whose comment endpoint 404s used to read
 * "This post no longer exists or was removed", naming the wrong object AND
 * asserting a deletion that never happened. Every field is optional and falls
 * back to that post wording, so existing callers are unchanged; a surface with a
 * different object overrides the lines that name it.
 *
 * Only the states that can NAME the object live here. "Đăng nhập" / "Thử lại" /
 * the composer placeholders are verbs about the reader, identical everywhere, and
 * stay in the shared namespace.
 */
export interface CommentThreadLabels {
    /** Nothing has been posted yet (the thread loaded fine and is empty). */
    empty?: string
    /** Unclassified failure. */
    loadFailed?: string
    /** A guest must sign in to read the thread. */
    loadFailedAuth?: string
    /** A signed-in viewer whose token expired mid-read. */
    loadFailedSessionExpired?: string
    /** The viewer may not read this thread (403). */
    loadFailedForbidden?: string
    /** The server said the record is gone — 410 / a GraphQL `NOT_FOUND`. */
    loadFailedGone?: string
    /** A bare 404: nothing at that URL, cause unknown. NEVER claim a deletion. */
    loadFailedUnavailable?: string
    /** The request never left the device. */
    loadFailedNetwork?: string
    /** The server errored (5xx). */
    loadFailedServer?: string
}

/** Props for {@link CommentLoadError}. */
export interface CommentLoadErrorProps {
    /** The SWR rejection. Omitted / unrecognized → the generic message, retry offered. */
    error?: unknown
    /** Re-attempt the fetch in place; the button only renders when a retry can help. */
    onRetry?: () => void
    /**
     * Surface-specific wording ({@link CommentThreadLabels}). Any field left out
     * falls back to the shared community-POST copy, so a caller that passes
     * nothing behaves exactly as before.
     */
    labels?: CommentThreadLabels
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
 * The line itself comes from `labels` when the surface supplied one for this kind
 * and from the shared community-POST copy otherwise — see
 * {@link CommentThreadLabels} for why a non-post surface must override.
 *
 * @param props - {@link CommentLoadErrorProps}
 */
export const CommentLoadError = ({
    error,
    onRetry,
    labels,
    className,
}: CommentLoadErrorProps) => {
    const t = useTranslations("communityHub")
    const { authenticated, requireAuth } = useRequireAuth()
    const kind = useMemo(() => classifyCommentLoadError(error), [error])

    const isExpiredSession = kind === "auth" && authenticated
    const override = isExpiredSession
        ? labels?.loadFailedSessionExpired
        : labels?.[LABEL_FIELD[kind]]
    const messageKey = isExpiredSession
        ? "engagement.commentsLoadFailedSessionExpired"
        : MESSAGE_KEY[kind]
    const canRetry = Boolean(onRetry) && (RETRYABLE.has(kind) || isExpiredSession)

    return (
        <div className={cn("flex flex-col items-start gap-2", className)}>
            <Typography type="body-sm" color="muted">
                {override ?? t(messageKey)}
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
