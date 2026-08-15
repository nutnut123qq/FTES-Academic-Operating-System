"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { useTour } from "@/components/features/onboarding"
import { MascotBubble } from "@/components/reuseable/FtesMascot"
import { useMyMajor } from "@/components/features/profile/hooks/useMyMajor"
import { useQueryMajorsSwr } from "@/components/features/subject/hooks/useQueryMajorsSwr"
import { isNudgeDismissed, markNudgeDismissed } from "./persistence"

/** localStorage id cho lời mời chọn ngành (một lần mỗi thiết bị). */
const NUDGE_ID = "pickMajor"

/**
 * Mời người dùng MỚI chọn NGÀNH HỌC (BE V335).
 *
 * Chủ dự án muốn "user mới đăng ký lần đầu thì cho chọn ngành trước". Ở đây nó là một lời MỜI
 * chứ KHÔNG phải cổng chặn — cố ý:
 *   • bỏ qua được ("Để sau"), và bỏ qua rồi thì không hỏi lại trên thiết bị này;
 *   • người chưa chọn ngành vẫn dùng workplace bình thường, chỉ là thấy TẤT CẢ môn;
 *   • không chặn đường vào sản phẩm — một bước onboarding bắt buộc là cách nhanh nhất để mất
 *     người dùng mới.
 *
 * Không hiện khi: chưa đăng nhập, đã chọn ngành, đã bỏ qua, đang có guided tour trên màn hình
 * (một linh vật một lúc), hoặc danh mục ngành rỗng / BE chưa deploy V335 — lúc đó không có gì
 * để chọn nên hỏi là vô nghĩa.
 */
export const MascotMajorPicker = () => {
    const t = useTranslations("mascot.nudge.pickMajor")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { isActive: tourActive } = useTour()
    const { needsMajor, setMajor } = useMyMajor()
    const { majors } = useQueryMajorsSwr()

    // Quyết định ở CLIENT (localStorage + an toàn SSR): bắt đầu ở trạng thái ẩn, chỉ hiện khi
    // biết chắc thiết bị này chưa bỏ qua.
    const [dismissed, setDismissed] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [failed, setFailed] = useState(false)
    useEffect(() => {
        setDismissed(isNudgeDismissed(NUDGE_ID))
    }, [])

    const onDismiss = () => {
        markNudgeDismissed(NUDGE_ID)
        setDismissed(true)
    }

    const onPick = async (code: string) => {
        setSaving(code)
        setFailed(false)
        try {
            await setMajor(code)
            // Chọn xong thì đánh dấu đã xong luôn: `needsMajor` sẽ tự thành false sau khi
            // revalidate, nhưng đánh dấu ở đây để không nháy lại lời mời trong lúc chờ.
            markNudgeDismissed(NUDGE_ID)
            setDismissed(true)
        } catch {
            // BE từ chối (mã lạ / mất mạng): giữ lời mời trên màn hình + báo lỗi, KHÔNG nuốt im
            // rồi đóng như thể đã lưu được.
            setFailed(true)
        } finally {
            setSaving(null)
        }
    }

    if (!authenticated || dismissed || tourActive || !needsMajor || majors.length === 0) {
        return null
    }

    return (
        <div className="rounded-2xl border border-default bg-surface p-3">
            <MascotBubble
                pose="point"
                title={t("title")}
                actions={
                    <>
                        {majors.map((major) => (
                            <Button
                                key={major.code}
                                size="sm"
                                variant="primary"
                                isDisabled={saving !== null}
                                onPress={() => void onPick(major.code)}
                            >
                                {major.name}
                            </Button>
                        ))}
                        <Button size="sm" variant="tertiary" isDisabled={saving !== null} onPress={onDismiss}>
                            {t("dismiss")}
                        </Button>
                    </>
                }
            >
                {failed ? t("error") : t("body")}
            </MascotBubble>
        </div>
    )
}
