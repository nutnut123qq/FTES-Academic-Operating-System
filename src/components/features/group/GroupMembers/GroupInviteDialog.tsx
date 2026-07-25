"use client"

import React, { useEffect, useState } from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { search, type SearchHitView } from "@/modules/api/rest/search"
import { useRestWithToast } from "@/modules/toast/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { usePostInviteToGroupSwr } from "@/hooks/swr/api/rest/mutations/usePostInviteToGroupSwr"
import { UserAvatar } from "@/components/reuseable/UserAvatar"

/** Quiet period before a keystroke turns into a search request. */
const SEARCH_DEBOUNCE_MS = 250

/** Max people offered in the picker. */
const SEARCH_LIMIT = 6

/** Accepts a pasted internal user id as an invitee (the BE takes a UUID). */
const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** One person offered in the picker. */
interface InviteCandidate {
    /** Internal user id — the search doc id of a USER document IS the user id
     *  (`UserSearchFeed.toDocument` indexes `profile.userId`), which is exactly
     *  what `POST /groups/{id}/invitations` wants as `inviteeId`. */
    userId: string
    /** URL-facing handle (indexed as the doc slug). */
    username: string | null
    /** Display name — falls back to the handle. */
    displayName: string
    /** Avatar URL when the profile has one. */
    avatarUrl: string | null
}

/** Adapts one USER search hit into a picker row. */
const toCandidate = (hit: SearchHitView): InviteCandidate => ({
    userId: hit.docId,
    username: hit.slug ?? null,
    displayName: hit.title || hit.slug || hit.docId,
    avatarUrl: hit.thumbnail ?? null,
})

/** Props for {@link GroupInviteDialog}. */
export interface GroupInviteDialogProps {
    /** Whether the dialog is open. */
    isOpen: boolean
    /** Close the dialog (backdrop, Esc, cancel, or a successful invite). */
    onClose: () => void
    /** Group the invitation is for. */
    groupId: string
}

/**
 * "Invite a member" dialog: type a name/handle, pick a person, send the invite
 * (`POST /groups/{id}/invitations`). The typeahead reuses the REST search index
 * (`GET /search?types=user`) exactly like the `@` mention popup — the USER doc id
 * is the internal user id, so the picked hit can be invited directly with no extra
 * lookup. A pasted user UUID is accepted verbatim for the case where the invitee is
 * not indexed (fresh profile) but the id is known.
 *
 * Failures are surfaced by {@link useRestWithToast} using the BE message, which
 * already distinguishes the meaningful cases: already a member
 * (`GROUP_ALREADY_MEMBER`), an invite still pending (`GROUP_INVITE_PENDING`), no
 * permission on a private group (403) and the invite rate limit (429).
 *
 * @param props - {@link GroupInviteDialogProps}
 */
export const GroupInviteDialog = ({ isOpen, onClose, groupId }: GroupInviteDialogProps) => {
    const t = useTranslations("groupsHub")
    const runRest = useRestWithToast()
    const { requireAuth } = useRequireAuth()
    const { trigger, isMutating } = usePostInviteToGroupSwr()
    const [query, setQuery] = useState("")
    const [candidates, setCandidates] = useState<Array<InviteCandidate>>([])
    const [isSearching, setIsSearching] = useState(false)

    // debounce the lookup; a stale response never lands (the cleanup flips `active`).
    useEffect(() => {
        const q = query.trim()
        if (!isOpen || q.length < 2) {
            setCandidates([])
            setIsSearching(false)
            return
        }
        let active = true
        setIsSearching(true)
        const timer = setTimeout(() => {
            void (async () => {
                try {
                    const response = await search({
                        q,
                        types: ["user"],
                        page: 0,
                        size: SEARCH_LIMIT,
                    })
                    const hits =
                        response.groups?.find((group) => group.type === "USER")?.hits ?? []
                    if (active) {
                        setCandidates(hits.map(toCandidate))
                    }
                } catch {
                    // a failed/forbidden lookup must never interrupt typing — the
                    // pasted-id path stays available
                    if (active) {
                        setCandidates([])
                    }
                } finally {
                    if (active) {
                        setIsSearching(false)
                    }
                }
            })()
        }, SEARCH_DEBOUNCE_MS)
        return () => {
            active = false
            clearTimeout(timer)
        }
    }, [isOpen, query])

    const onInvite = async (inviteeId: string) => {
        if (isMutating || !requireAuth("auth.context.generic")) {
            return
        }
        const sent = await runRest(
            () => trigger({ id: groupId, request: { inviteeId } }),
            { successMessage: t("members.invited") },
        )
        if (sent !== null) {
            setQuery("")
            setCandidates([])
            onClose()
        }
    }

    const pastedId = query.trim()
    const canInvitePastedId = UUID_PATTERN.test(pastedId)

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onClose()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <Typography type="body" weight="bold">
                                {t("members.inviteTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-3">
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={t("members.invitePlaceholder")}
                                aria-label={t("members.invitePlaceholder")}
                                className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                            />
                            <Typography type="body-xs" color="muted">
                                {t("members.inviteHint")}
                            </Typography>

                            {isSearching ? (
                                <Typography type="body-sm" color="muted">
                                    {t("members.inviteSearching")}
                                </Typography>
                            ) : null}

                            {/* people picker — one press per row sends the invite */}
                            {candidates.map((candidate) => (
                                <div
                                    key={candidate.userId}
                                    className="flex items-center gap-3 rounded-2xl border border-separator p-3"
                                >
                                    <UserAvatar
                                        size="sm"
                                        avatar={candidate.avatarUrl}
                                        username={candidate.username ?? candidate.displayName}
                                        seed={candidate.username ?? candidate.userId}
                                        className="shrink-0"
                                    />
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <Typography type="body-sm" weight="medium" truncate>
                                            {candidate.displayName}
                                        </Typography>
                                        {candidate.username ? (
                                            <Typography type="body-xs" color="muted" truncate>
                                                {`@${candidate.username}`}
                                            </Typography>
                                        ) : null}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="shrink-0"
                                        isDisabled={isMutating}
                                        onPress={() => void onInvite(candidate.userId)}
                                    >
                                        {t("members.inviteAction")}
                                    </Button>
                                </div>
                            ))}

                            {!isSearching && candidates.length === 0 && query.trim().length >= 2 && !canInvitePastedId ? (
                                <Typography type="body-sm" color="muted">
                                    {t("members.inviteNoResults")}
                                </Typography>
                            ) : null}

                            {/* pasted user id — invite without a search hit */}
                            {canInvitePastedId ? (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="self-start"
                                    isPending={isMutating}
                                    onPress={() => void onInvite(pastedId)}
                                >
                                    {t("members.inviteById")}
                                </Button>
                            ) : null}
                        </Modal.Body>
                        <Modal.Footer className="justify-end gap-2">
                            <Button size="sm" variant="ghost" onPress={onClose} isDisabled={isMutating}>
                                {t("members.inviteClose")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
