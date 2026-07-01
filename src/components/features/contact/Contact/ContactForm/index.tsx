"use client"

import React from "react"
import {
    Button,
    Input,
    Label,
    ListBox,
    Select,
    TextArea,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { CONTACT_CATEGORY_KEYS } from "../constants"
import { useContactForm } from "@/hooks/rhf/useContactForm"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import type { ContactCategory } from "@/modules/api/graphql/mutations/types/contact"

/** Props for {@link ContactForm}. */
export type ContactFormProps = WithClassNames<undefined>

/**
 * The contact form: name · email · reason · message → the public `submitContact`
 * mutation (emailed to the team), toasted. On success it swaps to a confirmation
 * panel with a "send another" reset. Self-contained: owns the react-hook-form via
 * `useContactForm`; binds fields to HeroUI primitives (no styling).
 *
 * @param props - optional className (placement only).
 */
export const ContactForm = ({ className }: ContactFormProps) => {
    const t = useTranslations()
    const {
        watch,
        setValue,
        onSubmit,
        formState: { errors, isSubmitting },
        sent,
        onSendAnother,
    } = useContactForm()

    if (sent) {
        return (
            <EmptyState
                icon={<CheckCircleIcon />}
                title={t("contact.form.successTitle")}
                description={t("contact.form.successBody")}
                action={(
                    <Button variant="secondary" onPress={onSendAnother}>
                        {t("contact.form.sendAnother")}
                    </Button>
                )}
                className={className}
            />
        )
    }

    const category = watch("category")

    return (
        <form onSubmit={onSubmit} className={cn("flex flex-col gap-4", className)}>
            <TextField variant="secondary">
                <Label htmlFor="contact-name">{t("contact.form.name")}</Label>
                <Input
                    id="contact-name"
                    placeholder={t("contact.form.namePlaceholder")}
                    value={watch("name")}
                    onChange={(event) => setValue("name", event.target.value)}
                />
                {errors.name ? (
                    <Typography slot="description" type="body-xs" className="text-danger">
                        {errors.name.message}
                    </Typography>
                ) : null}
            </TextField>

            <TextField variant="secondary">
                <Label htmlFor="contact-email">{t("contact.form.email")}</Label>
                <Input
                    id="contact-email"
                    type="email"
                    placeholder={t("contact.form.emailPlaceholder")}
                    value={watch("email")}
                    onChange={(event) => setValue("email", event.target.value)}
                />
                {errors.email ? (
                    <Typography slot="description" type="body-xs" className="text-danger">
                        {errors.email.message}
                    </Typography>
                ) : null}
            </TextField>

            <div className="flex flex-col gap-2">
                <Label htmlFor="contact-category">{t("contact.form.category")}</Label>
                <Select.Root<{ id: string }, "single">
                    id="contact-category"
                    aria-label={t("contact.form.category")}
                    selectedKey={category}
                    onSelectionChange={(key) =>
                        setValue("category", String(key) as ContactCategory)
                    }
                >
                    <Select.Trigger aria-label={t("contact.form.category")}>
                        <Select.Value>
                            {() => (
                                <Typography type="body-sm">
                                    {t(`contact.categories.${category}`)}
                                </Typography>
                            )}
                        </Select.Value>
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox.Root aria-label={t("contact.form.category")}>
                            {CONTACT_CATEGORY_KEYS.map((key) => (
                                <ListBox.Item
                                    key={key}
                                    id={key}
                                    textValue={t(`contact.categories.${key}`)}
                                >
                                    {t(`contact.categories.${key}`)}
                                </ListBox.Item>
                            ))}
                        </ListBox.Root>
                    </Select.Popover>
                </Select.Root>
            </div>

            <TextField variant="secondary">
                <Label htmlFor="contact-message">{t("contact.form.message")}</Label>
                <TextArea
                    id="contact-message"
                    rows={5}
                    placeholder={t("contact.form.messagePlaceholder")}
                    value={watch("message")}
                    onChange={(event) => setValue("message", event.target.value)}
                    className="resize-none"
                />
                {errors.message ? (
                    <Typography slot="description" type="body-xs" className="text-danger">
                        {errors.message.message}
                    </Typography>
                ) : null}
            </TextField>

            <Button type="submit" variant="primary" isPending={isSubmitting}>
                {isSubmitting ? t("contact.form.submitting") : t("contact.form.submit")}
            </Button>
        </form>
    )
}
