"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useAppDispatch } from "@/redux/hooks"
import { setAdminApiKey } from "@/redux/slices/admin"

/** Zod schema for the admin API key form. */
export const adminApiKeySchema = z.object({
    /** Admin API key — required, non-empty. */
    apiKey: z.string().min(1, "API key is required"),
})

/** Form values, inferred from {@link adminApiKeySchema}. */
export type AdminApiKeyFormValues = z.infer<typeof adminApiKeySchema>

/**
 * react-hook-form for the admin API-key login form.
 * Submit: save the key to Redux then navigate to the tools page (replaces the old formik).
 * @returns the RHF methods (`control`, `watch`, `formState`…) plus `onSubmit` wrapped with `handleSubmit`.
 */
export const useAdminApiKeyForm = () => {
    const dispatch = useAppDispatch()
    const router = useRouter()
    const form = useForm<AdminApiKeyFormValues>({
        resolver: zodResolver(adminApiKeySchema),
        defaultValues: { apiKey: "" },
        // validate on change + blur, matching the old formik behavior (validateOnChange/Blur).
        mode: "onChange",
    })
    /** Wrap handleSubmit: only runs when the schema is valid. */
    const onSubmit = form.handleSubmit((values) => {
        dispatch(setAdminApiKey(values.apiKey))
        router.push("admin/tools/upload-video")
    })
    return { ...form, onSubmit }
}
