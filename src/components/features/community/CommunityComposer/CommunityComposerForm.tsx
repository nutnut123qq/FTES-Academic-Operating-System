"use client"

import React, { useCallback, useState } from "react"
import { Button, Chip, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { useRouter } from "@/i18n/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { PostImagePicker } from "@/components/blocks/feed/PostImagePicker"
import { createPost, sharePost } from "@/modules/api/rest/community"
import type { MediaInput } from "@/modules/api/rest/community/types"
import { QuotedPostCard } from "@/components/reuseable/QuotedPostCard"
import { useCommunityComposerOverlayState } from "@/hooks/zustand/overlay/hooks"
import { isCommunityFeedKey } from "../hooks/useQueryCommunityFeedSwr"

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
    /** Autofocus the title field (the modal surface wants it; the page doesn't). */
    autoFocusTitle?: boolean
    /** Called after a successful submit — the modal closes itself here. */
    onSubmitted?: () => void
}

/**
 * The community post form (kind chips + title + body + submit), shared by the
 * `/community/new` page and the composer modal. On submit it POSTs the draft via
 * the community REST API (`POST /community/posts`), then navigates to the created
 * post and notifies the surface (the modal closes). Guests get the
 * `AuthenticationModal`; a failed write keeps the draft and shows a toast.
 */
export const CommunityComposerForm = ({
    autoFocusTitle = false,
    onSubmitted,
}: CommunityComposerFormProps) => {
    const t = useTranslations("communityHub")
    const router = useRouter()
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()
    // Repost/quote mode (C-1): when a quoted post is stashed, the form embeds it and
    // routes submit to `sharePost` instead of `createPost`.
    const { quote, setQuote } = useCommunityComposerOverlayState()
    const isQuote = Boolean(quote)
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [kind, setKind] = useState<(typeof KINDS)[number]>("knowledge")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [media, setMedia] = useState<Array<MediaInput>>([])
    const [isUploading, setIsUploading] = useState(false)
    const [imagesResetToken, setImagesResetToken] = useState(0)

    // Submitting while an image is still uploading would publish the post without it.
    // A repost needs no title/body (an empty repost is a plain share); a new post does.
    const canSubmit = isQuote
        ? !isSubmitting
        : title.trim() !== "" && body.trim() !== "" && !isSubmitting && !isUploading

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
                // C-1 repost/quote: optional commentary → QUOTE, empty → plain REPOST.
                const commentary = body.trim()
                const shared = await sharePost(quote.id, {
                    shareType: commentary ? "QUOTE" : "REPOST",
                    quoteContent: commentary || undefined,
                })
                createdId = shared.id
                setQuote(null)
            } else {
                const created = await createPost({
                    postType: KIND_TO_POST_TYPE[kind],
                    title: title.trim(),
                    content: body.trim(),
                    media: media.length > 0 ? media : undefined,
                })
                createdId = created.id
            }
            setTitle("")
            setBody("")
            setMedia([])
            setImagesResetToken((token) => token + 1)
            // The create/share is the sole success signal. Revalidate every community-feed
            // infinite cache so an already-loaded feed shows the new post on
            // back-navigation, but keep it non-throwing: a feed-refetch error after a
            // SUCCESSFUL write must not be reported as a failure nor block nav.
            mutate(isCommunityFeedKey).catch(() => {})
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
            {/* kind chips + title + image picker are for a NEW post only; a repost
                embeds the quoted card and takes optional commentary instead. */}
            {!isQuote ? (
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
            ) : null}

            {!isQuote ? (
                <input
                    value={title}
                    autoFocus={autoFocusTitle}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t("composer.titleField")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                />
            ) : null}

            <textarea
                value={body}
                autoFocus={isQuote}
                onChange={(event) => setBody(event.target.value)}
                placeholder={isQuote ? t("composer.quotePlaceholder") : t("composer.bodyField")}
                rows={isQuote ? 3 : 6}
                className="w-full resize-none rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
            />

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
