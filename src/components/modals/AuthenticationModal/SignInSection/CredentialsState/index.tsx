"use client"

/**
 * **Sign-in step 1** — OAuth shortcuts, email/password, link to sign-up tab.
 *
 * Container: owns the sign-in formik (singleton `useSignInForm()`), the
 * router/dispatch wiring, and the OAuth redirect action; renders presentational
 * children inside the modal chrome (`Modal.CloseTrigger`, `Header`, `Body`).
 *
 * @see {@link SignInSection} for Redux step routing and folder conventions.
 */
import React, {
    useCallback,
    useEffect,
    useMemo,
} from "react"
import {
    Button,
    Modal,
    Separator,
    Spinner,
} from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { OAUTH_BUTTON_ITEMS } from "./map"
import { OauthButtons } from "./OauthButtons"
import { EmailField } from "./EmailField"
import { PasswordField } from "./PasswordField"
import { RememberMeRow } from "./RememberMeRow"
import { SignUpPrompt } from "./SignUpPrompt"
import { useAppDispatch } from "@/redux/hooks"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useSignInForm } from "@/hooks/zustand/signIn/useSignInForm"
import { KeycloakIdentityProvider } from "@/modules/api/graphql/mutations/types/exchange-code-for-token"
import { keycloakRedirect } from "@/modules/api/redirect/keycloak"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { SessionStorage } from "@/modules/storage/session/storage"
import { SessionStorageId } from "@/modules/storage/session/enums/id"
import { type SessionStorageOauthIdpHint } from "@/modules/storage/session/types/oauth-idp-hint"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { Turnstile } from "@/components/reuseable/Turnstile"
import { publicEnv } from "@/resources/env/public"
import { pathConfig } from "@/resources/path"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"

/** Props for {@link CredentialsState}; no own props (singleton-driven). */
export type CredentialsStateProps = WithClassNames<undefined>

/**
 * Credentials step container for the sign-in tab.
 */
export const CredentialsState = () => {
    const t = useTranslations()
    const {
        values,
        errors,
        touched,
        submitForm,
        setFieldValue,
        setFieldTouched,
        isSubmitting,
    } = useSignInForm()

    const router = useRouter()
    const dispatch = useAppDispatch()
    const locale = useLocale()
    const { close: onAuthenticationClose } = useAuthenticationOverlayState()

    // pre-check remember-me from the stored preference (spec auth-session-preferences)
    useEffect(() => {
        const stored = LocalStorage.getItem<boolean>(LocalStorageId.AuthRememberMe)
        if (stored !== undefined) {
            setFieldValue("rememberMe", stored)
        }
    }, [setFieldValue])

    /** Stable reference to the static OAuth button catalog. */
    const oauthButtons = useMemo(
        () => OAUTH_BUTTON_ITEMS,
        [],
    )

    /** Start the Keycloak OAuth redirect for the chosen provider. */
    const onOauthPress = useCallback(
        (provider: KeycloakIdentityProvider) => {
            // remember which IdP was used so the callback can resume the flow
            SessionStorage.setItem<SessionStorageOauthIdpHint>(
                SessionStorageId.OauthIdpHint,
                { provider },
            )
            // remember where the user started so the OAuth landing returns them here
            SessionStorage.setItem<string>(
                SessionStorageId.AuthReturnTo,
                window.location.pathname + window.location.search,
            )
            const url = provider === KeycloakIdentityProvider.Google
                ? keycloakRedirect.google
                : keycloakRedirect.github
            url.searchParams.set("redirect_uri", window.location.href)
            router.push(url.toString())
        },
        [
            router,
        ],
    )

    const onChangeEmail = useCallback(
        (value: string) => {
            setFieldValue("email", value)
        },
        [
            setFieldValue,
        ],
    )
    const onBlurEmail = useCallback(
        () => {
            setFieldTouched("email", true)
        },
        [
            setFieldTouched,
        ],
    )

    const onChangePassword = useCallback(
        (value: string) => {
            setFieldValue("password", value)
        },
        [
            setFieldValue,
        ],
    )
    const onBlurPassword = useCallback(
        () => {
            setFieldTouched("password", true)
        },
        [
            setFieldTouched,
        ],
    )

    const onChangeRememberMe = useCallback(
        (selected: boolean) => {
            // third arg true: run validation so dependent errors clear
            setFieldValue("rememberMe", selected, true)
            setFieldTouched("rememberMe", true, false)
        },
        [
            setFieldValue,
            setFieldTouched,
        ],
    )

    const onSubmit = useCallback(
        () => {
            submitForm()
        },
        [
            submitForm,
        ],
    )

    const onSwitchToSignUp = useCallback(
        () => {
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignUp))
        },
        [
            dispatch,
        ],
    )

    /** Close the modal and go to the full-page forgot-password flow. */
    const onForgotPassword = useCallback(
        () => {
            onAuthenticationClose()
            router.push(pathConfig().locale(locale).authentication().forgotPassword().build())
        },
        [
            onAuthenticationClose,
            router,
            locale,
        ],
    )

    // pending mock auth also disables the submit — no double submit (spec: modal quality)
    const isSubmitDisabled = (publicEnv().captcha.enabled && !values.captchaToken) || isSubmitting

    return (
        <>
            <Modal.CloseTrigger />
            <Modal.Header>
                <div className="text-center">
                    <div className="font-semibold text-lg">{t("auth.signIn.title")}</div>
                    <div className="text-xs text-muted">{t("auth.signIn.desc")}</div>
                </div>
            </Modal.Header>
            <Modal.Body>
                <OauthButtons
                    items={oauthButtons}
                    onOauthPress={onOauthPress}
                />

                <div className="h-3" />
                <div className="flex items-center justify-center">
                    <Separator className="flex-1" />
                    <div className="text-xs text-muted">{t("auth.signIn.or")}</div>
                    <Separator className="flex-1" />
                </div>

                <div className="h-3" />
                <EmailField
                    value={values.email}
                    error={errors.email}
                    touched={touched.email}
                    onChangeValue={onChangeEmail}
                    onBlurField={onBlurEmail}
                />

                <div className="h-3" />
                <PasswordField
                    value={values.password}
                    error={errors.password}
                    touched={touched.password}
                    onChangeValue={onChangePassword}
                    onBlurField={onBlurPassword}
                />

                <div className="h-3" />
                <RememberMeRow
                    isSelected={values.rememberMe}
                    onChangeSelected={onChangeRememberMe}
                    onForgotPassword={onForgotPassword}
                />

                {publicEnv().captcha.enabled && (
                    <Turnstile
                        onVerify={(token) => setFieldValue("captchaToken", token)}
                        onExpire={() => setFieldValue("captchaToken", undefined)}
                        onError={() => setFieldValue("captchaToken", undefined)}
                    />
                )}

                <div className="h-3" />
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isPending={isSubmitting}
                    isDisabled={isSubmitDisabled}
                    onPress={onSubmit}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? <Spinner color="current" size="sm" /> : null}
                            {t("auth.signIn.submit")}
                        </>
                    )}
                </Button>

                <div className="h-3" />
                <SignUpPrompt onSwitchToSignUp={onSwitchToSignUp} />
            </Modal.Body>
        </>
    )
}
