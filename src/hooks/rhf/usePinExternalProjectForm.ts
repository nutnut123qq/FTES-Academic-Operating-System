"use client"

import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { useAppSelector } from "@/redux/hooks"
import { QUERY_USER_PINNED_PROJECTS_SWR } from "@/hooks/swr/api/graphql/queries/useQueryUserPinnedProjectsSwr"
import { useMutatePinExternalProjectSwr } from "@/hooks/swr/api/graphql/mutations/useMutatePinExternalProjectSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Max length of the external-pin title (mirrors the entity column). */
const TITLE_MAX = 255
/** Max length of the external-pin description (mirrors the entity column). */
const DESCRIPTION_MAX = 1024
/** Max length of the external-pin URL (mirrors the entity column). */
const URL_MAX = 2048
/** Max number of tech-stack tags accepted (mirrors the backend cap). */
const TECH_STACK_MAX = 20

/** Editable external-pin form values. */
export interface PinExternalProjectFormValues {
    /** Project title (required). */
    title: string
    /** Optional description shown under the pin. */
    description: string
    /** Optional project URL. */
    url: string
    /** Comma/newline-separated tech-stack tags (parsed to an array on submit). */
    techStack: string
}

/** Parameters for {@link usePinExternalProjectForm}. */
export interface UsePinExternalProjectFormParams {
    /** Called after a successful pin (e.g. to close the modal). */
    onSuccess?: () => void
}

/**
 * react-hook-form for pinning a free-form external project. Validates the title
 * (required) + optional URL, splits the free-text tech-stack field into tags,
 * runs the `pinExternalProject` mutation through {@link useGraphQLWithToast},
 * revalidates the viewer's pinned-projects SWR cache, then resets the form and
 * invokes `onSuccess` (close the modal).
 *
 * @param params - {@link UsePinExternalProjectFormParams}
 * @returns the RHF methods + `onSubmit`.
 */
export const usePinExternalProjectForm = ({
    onSuccess,
}: UsePinExternalProjectFormParams = {}) => {
    const t = useTranslations()
    const { mutate } = useSWRConfig()
    const runGraphQL = useGraphQLWithToast()
    // the signed-in user owns the pins → revalidate their own pinned list on success
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const pinExternalSwr = useMutatePinExternalProjectSwr()

    const schema = useMemo(
        () => z.object({
            title: z.string().trim().min(1).max(TITLE_MAX),
            description: z.string().trim().max(DESCRIPTION_MAX),
            // accept an empty string (optional) or a valid URL
            url: z.union([
                z.literal(""),
                z.string().trim().url().max(URL_MAX),
            ]),
            techStack: z.string(),
        }),
        [],
    )

    const form = useForm<PinExternalProjectFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: "",
            description: "",
            url: "",
            techStack: "",
        },
    })

    /** Split the free-text tech-stack field into trimmed, de-duplicated tags. */
    const parseTechStack = useCallback(
        (raw: string): Array<string> =>
            Array.from(
                new Set(
                    raw
                        .split(/[,\n]/)
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0),
                ),
            ).slice(0, TECH_STACK_MAX),
        [],
    )

    const onSubmit = form.handleSubmit(async (value) => {
        await runGraphQL(
            async () => {
                const techStack = parseTechStack(value.techStack)
                const result = await pinExternalSwr.trigger({
                    title: value.title.trim(),
                    description: value.description.trim() || undefined,
                    url: value.url.trim() || undefined,
                    techStack: techStack.length > 0 ? techStack : undefined,
                })
                const env = result?.data?.pinExternalProject
                if (!env) {
                    throw new Error(t("toast.defaultError"))
                }
                // on success: revalidate the owner's pinned list, reset, close
                if (env.success) {
                    if (viewerId) {
                        await mutate([QUERY_USER_PINNED_PROJECTS_SWR, viewerId])
                    }
                    form.reset()
                    onSuccess?.()
                }
                return env
            },
            {
                showErrorToast: true,
                showSuccessToast: true,
            },
        )
    })

    return {
        ...form,
        onSubmit,
    }
}
