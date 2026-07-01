"use client"

import React, { useEffect, useState } from "react"
import {
    Button,
    Modal,
    Switch,
    Typography,
    cn,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useCookieConsentStore } from "@/hooks/zustand/cookieConsent/store"
import { useCookiePreferencesOverlayState } from "@/hooks/zustand/overlay/hooks"

/**
 * Cookie preferences modal — the granular "Tùy chỉnh" panel: Necessary (locked on) + Analytics (toggle),
 * with Save / Reject / Accept all. Holds its OWN draft toggle (seeded from the committed
 * {@link useCookieConsentStore} value each time it opens); Save commits the choice. Mounted once in
 * `ModalContainer`, opened via {@link useCookiePreferencesOverlayState}.
 *
 * @param props - optional className for the dialog
 */
export const CookieConsentModal = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations()
    const { isOpen, setOpen, close } = useCookiePreferencesOverlayState()
    const analyticsAllowed = useCookieConsentStore((state) => state.analyticsAllowed)
    const save = useCookieConsentStore((state) => state.save)
    const acceptAll = useCookieConsentStore((state) => state.acceptAll)
    const rejectAll = useCookieConsentStore((state) => state.rejectAll)

    // draft toggle — re-seed from the committed value whenever the modal opens
    const [analyticsDraft, setAnalyticsDraft] = useState(analyticsAllowed)
    useEffect(() => {
        if (isOpen) {
            setAnalyticsDraft(analyticsAllowed)
        }
    }, [isOpen, analyticsAllowed])

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Typography type="body" weight="semibold" className="pr-8">
                                {t("cookieConsent.modalTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-6">
                                <Typography type="body-sm" color="muted">
                                    {t("cookieConsent.modalBody")}
                                </Typography>

                                {/* necessary — always on, locked */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col gap-0">
                                        <Typography type="body" weight="semibold">
                                            {t("cookieConsent.necessaryLabel")}
                                        </Typography>
                                        <Typography type="body-sm" color="muted">
                                            {t("cookieConsent.necessaryHint")}
                                        </Typography>
                                    </div>
                                    <Switch isSelected isDisabled aria-label={t("cookieConsent.necessaryLabel")} />
                                </div>

                                {/* analytics — toggleable */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col gap-0">
                                        <Typography type="body" weight="semibold">
                                            {t("cookieConsent.analyticsLabel")}
                                        </Typography>
                                        <Typography type="body-sm" color="muted">
                                            {t("cookieConsent.analyticsHint")}
                                        </Typography>
                                    </div>
                                    <Switch
                                        isSelected={analyticsDraft}
                                        onChange={(value) => setAnalyticsDraft(value)}
                                        aria-label={t("cookieConsent.analyticsLabel")}
                                    />
                                </div>

                                {/* actions — parity: save / reject equal, accept-all tertiary */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onPress={() => { save(analyticsDraft); close() }}
                                    >
                                        {t("cookieConsent.save")}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onPress={() => { rejectAll(); close() }}
                                    >
                                        {t("cookieConsent.reject")}
                                    </Button>
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        onPress={() => { acceptAll(); close() }}
                                    >
                                        {t("cookieConsent.acceptAll")}
                                    </Button>
                                </div>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
