"use client"

import React, { useCallback, useState } from "react"
import {
    Button,
    Card,
    CardContent,
    TextArea,
    TextField,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { CommunityChannel } from "@/modules/api/graphql/queries/types/community-feed"
import { useMutateCreateCommunityPostSwr } from "@/hooks/swr/api/graphql/mutations/useMutateCreateCommunityPostSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Props for the {@link CommunityComposer} sub-component. */
export interface CommunityComposerProps {
    /** Channel new posts are published to (the "all" tab posts to General). */
    channel: CommunityChannel
    /** Called after a post is created so the feature can refetch the feed. */
    onPosted: () => void
}

/**
 * Compose box for a new community post: a body textarea + a post button. Creation
 * goes through the toast-wrapped mutation, so the server-side quota error (for
 * non-members over their limit) surfaces as a toast automatically. On success the
 * box clears and `onPosted` refetches the feed.
 *
 * @param props - {@link CommunityComposerProps}
 */
export const CommunityComposer = ({
    channel,
    onPosted,
}: CommunityComposerProps) => {
    const t = useTranslations()
    const [body, setBody] = useState("")
    const runGraphQL = useGraphQLWithToast()
    const { trigger: createPost, isMutating } = useMutateCreateCommunityPostSwr()

    /** Validate, submit, then clear + refetch on success. */
    const onSubmit = useCallback(async () => {
        // ignore empty/whitespace-only bodies
        const trimmed = body.trim()
        if (!trimmed) {
            return
        }
        // create via the toast wrapper so quota/auth errors surface as a toast;
        // the action returns the inner GraphQLResponse the toast wrapper inspects
        const ok = await runGraphQL(
            async () => {
                const result = await createPost({
                    channel,
                    body: trimmed,
                })
                return result.data!.createCommunityPost
            },
            { showSuccessToast: true },
        )
        // only clear + refetch when the create actually succeeded
        if (ok) {
            setBody("")
            onPosted()
        }
    }, [body, channel, createPost, runGraphQL, onPosted])

    return (
        <Card>
            <CardContent>
                <div className="flex flex-col gap-3">
                    <TextField variant="secondary">
                        <TextArea
                            rows={3}
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            placeholder={t("community.composerPlaceholder")}
                            aria-label={t("community.composerPlaceholder")}
                            className="resize-none"
                        />
                    </TextField>
                    <div className="flex justify-end">
                        <Button
                            variant="primary"
                            isPending={isMutating}
                            isDisabled={!body.trim()}
                            onPress={() => void onSubmit()}
                        >
                            {t("community.post")}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
