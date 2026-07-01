"use client"

import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { useMutateSubmitContactSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSubmitContactSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import type { ContactCategory } from "@/modules/api/graphql/mutations/types/contact"

/** Max lengths (mirror the contact-form expectations). */
const NAME_MAX = 100
const EMAIL_MAX = 255
const MESSAGE_MAX = 5000

/** Contact-form values. */
export interface ContactFormValues {
    /** Sender's display name. */
    name: string
    /** Sender's email (used as reply-to). */
    email: string
    /** Reason for contacting. */
    category: ContactCategory
    /** The message body. */
    message: string
}

/**
 * react-hook-form for the public contact form. Validates with zod (i18n messages),
 * submits via the `submitContact` mutation (toasted), and exposes a `sent` flag so
 * the form can swap to a success panel + `reset` to send another.
 *
 * @returns the RHF methods + `onSubmit`, `sent`, and `onSendAnother`.
 */
export const useContactForm = () => {
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()
    const submitContactSwr = useMutateSubmitContactSwr()
    const [sent, setSent] = useState(false)

    const schema = useMemo(
        () => z.object({
            name: z.string().trim().min(1, t("contact.form.nameRequired")).max(NAME_MAX),
            email: z.string().trim().email(t("contact.form.emailInvalid")).max(EMAIL_MAX),
            category: z.enum(["course_support", "partnership", "general"]),
            message: z.string().trim().min(1, t("contact.form.messageRequired")).max(MESSAGE_MAX),
        }),
        [t],
    )

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            category: "course_support",
            message: "",
        },
    })

    const onSubmit = form.handleSubmit(async (value) => {
        await runGraphQL(
            async () => {
                const result = await submitContactSwr.trigger({
                    name: value.name.trim(),
                    email: value.email.trim(),
                    category: value.category,
                    message: value.message.trim(),
                })
                const env = result?.data?.submitContact
                if (!env) {
                    throw new Error(t("contact.form.errorTitle"))
                }
                // on success swap to the confirmation panel
                if (env.success) {
                    setSent(true)
                }
                return env
            },
            {
                showErrorToast: true,
                showSuccessToast: true,
            },
        )
    })

    /** Reset back to a blank form to send another message. */
    const onSendAnother = useCallback(
        () => {
            form.reset()
            setSent(false)
        },
        [form],
    )

    return {
        ...form,
        onSubmit,
        sent,
        onSendAnother,
    }
}
