"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, Chip, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import useSWR, { useSWRConfig } from "swr"
import { useRouter } from "@/i18n/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { PostImagePicker } from "@/components/blocks/feed/PostImagePicker"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"
import { splitTitleFromMarkdown } from "@/components/reuseable/RichTextEditor/title"
import { CampusPicker } from "@/components/reuseable/CampusPicker"
import { createPost, sharePost } from "@/modules/api/rest/community"
import type { MediaInput } from "@/modules/api/rest/community/types"
import { getSelfProfile } from "@/modules/api/rest/profile"
import { useSelfProfileKey } from "@/components/features/profile/hooks/useQueryProfileSwr"
import { QuotedPostCard } from "@/components/reuseable/QuotedPostCard"
import { useCommunityComposerOverlayState } from "@/hooks/zustand/overlay/hooks"
import { revalidateCommunityFeeds } from "../hooks/useQueryCommunityFeedSwr"
import { useQueryCampusesSwr } from "../hooks/useQueryCampusesSwr"

/** Post kinds a user can attach (§6). */
const KINDS = ["knowledge", "question", "showcase", "resource"] as const

/**
 * Maps a composer kind chip to the BE `postType` (PostService allow-list). "resource"
 * maps to DISCUSSION rather than RESOURCE_SHARE because the latter requires a
 * `resourceRef` the composer can't attach yet (BE 400 COMMUNITY_RESOURCE_REF_REQUIRED).
 */
const KIND_TO_POST_TYPE: Record<(typeof KINDS)[number], string> = {
    knowledge: "KNOWLEDGE_SHARING",
    question: "QUESTION",
    showcase: "PROJECT_SHOWCASE",
    resource: "DISCUSSION",
}

/** Props for {@link CommunityComposerForm}. */
interface CommunityComposerFormProps {
    /** Autofocus the body editor (the modal surface wants it; the page doesn't). */
    autoFocus?: boolean
    /** Called after a successful submit — the modal closes itself here. */
    onSubmitted?: () => void
}

/**
 * The community post form (kind chips + single body editor + submit), shared by
 * the `/community/new` page and the composer modal. There is NO separate title
 * field: the author writes everything in one {@link RichTextEditor} and marks a
 * leading H1 for the title, which is DERIVED (and stripped from the body) on
 * submit via {@link splitTitleFromMarkdown}. On submit it POSTs the draft via the
 * community REST API (`POST /community/posts`), then navigates to the created
 * post and notifies the surface (the modal closes). Guests get the
 * `AuthenticationModal`; a failed write keeps the draft and shows a toast.
 */
export const CommunityComposerForm = ({
    autoFocus = false,
    onSubmitted,
}: CommunityComposerFormProps) => {
    const t = useTranslations("communityHub")
    const router = useRouter()
    const { mutate, cache } = useSWRConfig()
    const { requireAuth } = useRequireAuth()
    // Repost/quote mode (C-1): when a quoted post is stashed, the form embeds it and
    // routes submit to `sharePost` instead of `createPost`.
    const { quote, setQuote } = useCommunityComposerOverlayState()
    const isQuote = Boolean(quote)
    const [body, setBody] = useState("")
    const [kind, setKind] = useState<(typeof KINDS)[number]>("knowledge")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [media, setMedia] = useState<Array<MediaInput>>([])
    const [isUploading, setIsUploading] = useState(false)
    const [imagesResetToken, setImagesResetToken] = useState(0)
    // Optional campus tag (§ Campus feed): `null` = no campus. The picker's value is a
    // campus CODE the BE validates against the active-campus list.
    const [campus, setCampus] = useState<string | null>(null)
    const { campuses } = useQueryCampusesSwr()
    // Default the pick to the author's own campus WHEN it's readily available — reads the
    // SHARED self-profile cache (same key as the profile shell/edit), so no extra fetch on
    // pages that already warmed it; the key is null for guests (never 401 for a default)
    // AND carries the viewer id, so B never seeds the composer with A's campus.
    const { data: selfProfile } = useSWR(useSelfProfileKey(), getSelfProfile)
    const seededCampusRef = useRef(false)
    useEffect(() => {
        // Seed exactly ONCE, after both the campus list and the profile have resolved, so a
        // later user pick is never clobbered. Only apply when the profile campus matches an
        // active option; otherwise leave it unset ("no campus").
        if (seededCampusRef.current || selfProfile === undefined || campuses.length === 0) {
            return
        }
        seededCampusRef.current = true
        const profileCampus = selfProfile.academic?.campus ?? null
        if (profileCampus && campuses.some((option) => option.code === profileCampus)) {
            setCampus(profileCampus)
        }
    }, [selfProfile, campuses])

    // Submitting while an image is still uploading would publish the post without it.
    // A repost needs no body (an empty repost is a plain share); a new post needs a
    // non-empty editor (its leading H1 becomes the title, the rest is the content).
    const canSubmit = isQuote
        ? !isSubmitting
        : body.trim() !== "" && !isSubmitting && !isUploading

    const onImagesChange = useCallback((next: Array<MediaInput>) => setMedia(next), [])
    const onUploadingChange = useCallback((uploading: boolean) => setIsUploading(uploading), [])

    const onSubmit = async () => {
        if (!requireAuth("auth.context.generic")) {
            return
        }
        setIsSubmitting(true)
        try {
            let createdId: string
            if (quote) {
                // C-1 repost/quote: optional commentary → QUOTE, empty → plain SHARE.
                // Only those two values exist in the BE allowlist
                // (`InteractionService.SHARE_TYPES`); anything else — "REPOST",
                // "LINK", … — is a 400 `COMMUNITY_INVALID_SHARE_TYPE`.
                const commentary = body.trim()
                const shared = await sharePost(quote.id, {
                    shareType: commentary ? "QUOTE" : "SHARE",
                    quoteContent: commentary || undefined,
                })
                createdId = shared.id
                setQuote(null)
            } else {
                // Single editor: the leading H1 is the title (stripped from the body
                // so the detail render never shows it twice); no H1 → first line.
                const { title, body: content } = splitTitleFromMarkdown(body)
                const created = await createPost({
                    postType: KIND_TO_POST_TYPE[kind],
                    title,
                    content,
                    media: media.length > 0 ? media : undefined,
                    // Only tag a real campus code; the "no campus" choice omits it entirely.
                    campus: campus ?? undefined,
                })
                createdId = created.id
            }
            setBody("")
            setMedia([])
            setImagesResetToken((token) => token + 1)
            // The create/share is the sole success signal. Revalidate every community-feed
            // infinite cache so an already-loaded feed shows the new post on
            // back-navigation, but keep it non-throwing: a feed-refetch error after a
            // SUCCESSFUL write must not be reported as a failure nor block nav.
            revalidateCommunityFeeds(cache, mutate).catch(() => {})
            onSubmitted?.()
            router.push(`/community/${createdId}`)
        } catch {
            toast.danger(isQuote ? t("composer.repostFailed") : t("composer.createFailed"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* kind chips + image picker are for a NEW post only; a repost embeds the
                quoted card and takes optional commentary instead. */}
            {!isQuote ? (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                        {KINDS.map((option) => (
                            <button key={option} type="button" onClick={() => setKind(option)}>
                                <Chip
                                    size="sm"
                                    variant={kind === option ? "primary" : "soft"}
                                    color="accent"
                                >
                                    {t(`composer.kinds.${option}`)}
                                </Chip>
                            </button>
                        ))}
                    </div>
                    {/* Optional campus tag — placeholder = "no campus" (a global post). */}
                    <CampusPicker
                        campuses={campuses}
                        value={campus}
                        onChange={setCampus}
                        placeholder={t("composer.campusAll")}
                        ariaLabel={t("composer.campusLabel")}
                        className="self-start"
                    />
                </div>
            ) : null}

            {isQuote ? (
                // Repost commentary stays PLAIN text — a repost card renders it raw,
                // so it must not emit Markdown (only the post body is a Markdown surface).
                <textarea
                    value={body}
                    autoFocus
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={t("composer.quotePlaceholder")}
                    rows={3}
                    // Same box radius as the RichTextEditor shell used by the non-quote branch
                    // (`rounded-2xl`): both are THE composer input of this one modal, so a
                    // tighter `rounded-large` here read as a square box next to everything else.
                    className="w-full resize-none rounded-2xl border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                />
            ) : (
                <RichTextEditor
                    value={body}
                    onChange={setBody}
                    toolbar="full"
                    placeholder={t("composer.bodyField")}
                    minHeight={160}
                    autoFocus={autoFocus}
                />
            )}

            {quote ? (
                <QuotedPostCard post={quote} />
            ) : (
                <PostImagePicker
                    onChange={onImagesChange}
                    onUploadingChange={onUploadingChange}
                    resetToken={imagesResetToken}
                />
            )}

            <Button
                variant="secondary"
                className="self-start"
                isDisabled={!canSubmit}
                isPending={isSubmitting}
                onPress={onSubmit}
            >
                {isQuote ? t("composer.repostSubmit") : t("composer.submit")}
            </Button>
        </div>
    )
}
