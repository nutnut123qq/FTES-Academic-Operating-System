"use client"

import React from "react"
import { Controller } from "react-hook-form"
import {
    Button,
    FieldError,
    Input,
    Label,
    Spinner,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { KeyIcon } from "@phosphor-icons/react"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { Callout } from "@/components/blocks/feedback/Callout"
import { useChangePasswordForm } from "@/hooks/rhf/useChangePasswordForm"

/** The three fields, in tab order, with the autocomplete token each one wants. */
const FIELDS = [
    { name: "currentPassword", autoComplete: "current-password" },
    { name: "newPassword", autoComplete: "new-password" },
    { name: "confirmPassword", autoComplete: "new-password" },
] as const

/**
 * ChangePasswordSection — change the account password from settings
 * (`PUT /identity/password`).
 *
 * States the consequence BEFORE submit: the backend signs every other device out on a
 * successful change, which is a surprise worth spelling out rather than discovering.
 *
 * All three inputs are write-only secrets — `type="password"`, no prefill and
 * deliberately NO "reveal" toggle (house secrets rule) — and the form clears itself
 * once the change lands.
 */
export const ChangePasswordSection = () => {
    const t = useTranslations()
    const { control, formState, onSubmit } = useChangePasswordForm()

    return (
        <SectionCard
            title={t("security.password.title")}
            icon={<KeyIcon className="size-5 text-muted" aria-hidden focusable="false" />}
        >
            <Typography type="body-sm" color="muted">
                {t("security.password.subtitle")}
            </Typography>

            <Callout status="warning" title={t("security.password.signsOutOthers")} />

            <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                    event.preventDefault()
                    void onSubmit(event)
                }}
                noValidate
            >
                {FIELDS.map((field) => (
                    <Controller
                        key={field.name}
                        control={control}
                        name={field.name}
                        render={({ field: controlled, fieldState }) => (
                            <TextField
                                variant="secondary"
                                isInvalid={fieldState.invalid && fieldState.isTouched}
                            >
                                <Label htmlFor={`change-password-${field.name}`}>
                                    {t(`security.password.${field.name}`)}
                                </Label>
                                <Input
                                    id={`change-password-${field.name}`}
                                    type="password"
                                    autoComplete={field.autoComplete}
                                    name={controlled.name}
                                    ref={controlled.ref}
                                    value={controlled.value}
                                    onChange={(event) => controlled.onChange(event.target.value)}
                                    onBlur={controlled.onBlur}
                                />
                                <FieldError>{fieldState.error?.message}</FieldError>
                            </TextField>
                        )}
                    />
                ))}

                <Button
                    type="submit"
                    variant="primary"
                    className="self-start"
                    isPending={formState.isSubmitting}
                    isDisabled={formState.isSubmitting}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? <Spinner color="current" size="sm" /> : null}
                            {t("security.password.submit")}
                        </>
                    )}
                </Button>
            </form>
        </SectionCard>
    )
}
