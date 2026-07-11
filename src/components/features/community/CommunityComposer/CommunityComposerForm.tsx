"use client"

import React, { useState } from "react"
import { Button, Chip, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { useRouter } from "@/i18n/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createPost } from "@/modules/api/rest/community"
import { COMMUNITY_FEED_KEY } from "../hooks/useQueryCommunityFeedSwr"

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
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [kind, setKind] = useState<(typeof KINDS)[number]>("knowledge")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const canSubmit = title.trim() !== "" && body.trim() !== "" && !isSubmitting

    const onSubmit = async () => {
        if (!requireAuth("auth.context.generic")) {
            return
        }
        setIsSubmitting(true)
        try {
            const created = await createPost({
                postType: KIND_TO_POST_TYPE[kind],
                title: title.trim(),
                content: body.trim(),
            })
            setTitle("")
            setBody("")
            // createPost is the sole success signal. Revalidate the feed so an
            // already-loaded feed shows the new post on back-navigation, but keep it
            // non-throwing: a feed-refetch error after a SUCCESSFUL create must not be
            // reported as a create failure nor block navigation.
            mutate(COMMUNITY_FEED_KEY).catch(() => {})
            onSubmitted?.()
            router.push(`/community/${created.id}`)
        } catch {
            toast.danger(t("composer.createFailed"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* kind chips */}
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

            {/* fields */}
            <input
                value={title}
                autoFocus={autoFocusTitle}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("composer.titleField")}
                className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
            <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t("composer.bodyField")}
                rows={6}
                className="w-full resize-none rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
            />

            <Button
                variant="secondary"
                className="self-start"
                isDisabled={!canSubmit}
                isPending={isSubmitting}
                onPress={onSubmit}
            >
                {t("composer.submit")}
            </Button>
        </div>
    )
}
