"use client"

import React from "react"
import {
    Button,
    Input,
    Label,
    Spinner,
    TextArea,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { usePinExternalProjectForm } from "@/hooks/rhf/usePinExternalProjectForm"

/** Props for {@link ExternalProjectForm}. */
export interface ExternalProjectFormProps extends WithClassNames<undefined> {
    /** Called after a pin succeeds (close the modal / switch to the list). */
    onSuccess?: () => void
}

/**
 * Form for pinning a free-form external project (title + optional description /
 * url / tech-stack tags). All form logic lives in the
 * {@link usePinExternalProjectForm} RHF hook; this component only binds the
 * fields and surfaces validation + the in-flight submit state. Reuseable-ish but
 * kept here as it is specific to the manage-pins modal.
 *
 * @param props - {@link ExternalProjectFormProps}
 */
export const ExternalProjectForm = ({
    onSuccess,
    className,
}: ExternalProjectFormProps) => {
    const t = useTranslations()
    const {
        register,
        onSubmit,
        formState: {
            errors,
            isSubmitting,
        },
    } = usePinExternalProjectForm({ onSuccess })

    return (
        <form
            className={className}
            onSubmit={onSubmit}
        >
            <div className="flex flex-col gap-3">
                {/* title (required) */}
                <TextField variant="secondary" isInvalid={Boolean(errors.title)}>
                    <Label htmlFor="pin-title">{t("pinnedProjects.form.title")}</Label>
                    <Input
                        id="pin-title"
                        placeholder={t("pinnedProjects.form.titlePlaceholder")}
                        {...register("title")}
                    />
                    {errors.title ? (
                        <Typography slot="errorMessage" type="body-xs" className="text-danger">
                            {t("pinnedProjects.form.titleRequired")}
                        </Typography>
                    ) : null}
                </TextField>

                {/* url (optional, validated) */}
                <TextField variant="secondary" isInvalid={Boolean(errors.url)}>
                    <Label htmlFor="pin-url">{t("pinnedProjects.form.url")}</Label>
                    <Input
                        id="pin-url"
                        placeholder={t("pinnedProjects.form.urlPlaceholder")}
                        {...register("url")}
                    />
                    {errors.url ? (
                        <Typography slot="errorMessage" type="body-xs" className="text-danger">
                            {t("pinnedProjects.form.urlInvalid")}
                        </Typography>
                    ) : null}
                </TextField>

                {/* tech stack (comma / newline separated) */}
                <TextField variant="secondary">
                    <Label htmlFor="pin-tech">{t("pinnedProjects.form.techStack")}</Label>
                    <Input
                        id="pin-tech"
                        placeholder={t("pinnedProjects.form.techStackPlaceholder")}
                        {...register("techStack")}
                    />
                    <Typography slot="description" type="body-xs" color="muted">
                        {t("pinnedProjects.form.techStackHint")}
                    </Typography>
                </TextField>

                {/* description (optional) */}
                <TextField variant="secondary">
                    <Label htmlFor="pin-description">{t("pinnedProjects.form.description")}</Label>
                    <TextArea
                        id="pin-description"
                        rows={3}
                        placeholder={t("pinnedProjects.form.descriptionPlaceholder")}
                        className="resize-none"
                        {...register("description")}
                    />
                </TextField>

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isDisabled={isSubmitting}
                    isPending={isSubmitting}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? (
                                <Spinner color="current" size="sm" />
                            ) : null}
                            {t("pinnedProjects.form.submit")}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
