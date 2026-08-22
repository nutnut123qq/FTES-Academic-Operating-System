"use client"

import React, { useEffect, useState } from "react"
import { Button, Modal } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { useTour } from "@/components/features/onboarding"
import { MascotBubble } from "@/components/reuseable/FtesMascot"
import { useMyMajor } from "@/components/features/profile/hooks/useMyMajor"
import { useQueryMajorsSwr } from "@/components/features/subject/hooks/useQueryMajorsSwr"
import { isNudgeDismissed, markNudgeDismissed } from "./persistence"

/** localStorage id cho khảo sát chọn ngành (một lần mỗi thiết bị). */
const NUDGE_ID = "pickMajor"

/**
 * KHẢO SÁT chọn NGÀNH HỌC cho người dùng mới (BE V335) — modal hai bước:
 * KHỐI NGÀNH → CHUYÊN NGÀNH → Lưu.
 *
 * Chủ dự án muốn "ai đăng ký lần đầu, vào workplace thì hiện ra một cái khảo sát chọn ngành".
 * Bản trước là một dải nút đặt thẳng đầu trang liệt kê PHẲNG mọi ngành: với syllabus FPT thì đó là
 * hàng chục nút trộn lẫn hai cấp, và nó nằm chìm trong trang nên dễ bị lướt qua. Modal hỏi đúng
 * một việc mỗi lúc, và cấp 2 chỉ liệt kê con của khối vừa chọn nên mỗi màn chỉ còn vài lựa chọn.
 *
 * <p>Vẫn là một lời MỜI chứ KHÔNG phải cổng chặn — cố ý, và đây là lý do KHÔNG được bỏ "Để sau"
 * khi sau này ai đó thấy modal là dịp tốt để ép chọn:
 *   • bỏ qua được ("Để sau"; đóng bằng Esc/bấm ra nền cũng tính là bỏ qua), và bỏ qua rồi thì
 *     không hỏi lại trên thiết bị này;
 *   • người chưa chọn ngành vẫn dùng workplace bình thường, chỉ là thấy TẤT CẢ môn;
 *   • một bước onboarding BẮT BUỘC là cách nhanh nhất để mất người dùng mới — chặn đường vào sản
 *     phẩm để lấy một trường hồ sơ có thể sửa bất cứ lúc nào ở trang cá nhân là đổi hớ.
 *
 * <p>Không hiện khi: chưa đăng nhập, đã chọn ngành, đã bỏ qua, đang có guided tour trên màn hình
 * (một linh vật một lúc), hoặc danh mục ngành rỗng / BE chưa deploy V335 — lúc đó không có gì để
 * chọn nên hỏi là vô nghĩa.
 */
export const MascotMajorPicker = () => {
    const t = useTranslations("mascot.nudge.pickMajor")
    const tCommon = useTranslations("common")
    // Nhãn "Tất cả {khối}" dùng chung với ô chọn cấp 2 ở SubjectCatalog — cùng một lựa chọn
    // thì phải đọc ra cùng một câu, đừng chép lại một chuỗi thứ hai.
    const tCatalog = useTranslations("subjects.catalog")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { isActive: tourActive } = useTour()
    const { needsMajor, setMajor } = useMyMajor()
    const { majors } = useQueryMajorsSwr()

    // Quyết định ở CLIENT (localStorage + an toàn SSR): bắt đầu ở trạng thái ẩn, chỉ hiện khi
    // biết chắc thiết bị này chưa bỏ qua.
    const [dismissed, setDismissed] = useState(true)
    // `null` = đang ở BƯỚC 1 (chọn khối); có mã = đã sang BƯỚC 2 (chọn chuyên ngành của khối đó).
    const [category, setCategory] = useState<string | null>(null)
    const [child, setChild] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [failed, setFailed] = useState(false)
    useEffect(() => {
        setDismissed(isNudgeDismissed(NUDGE_ID))
    }, [])

    const categories = majors.filter((major) => major.parentCode === null)
    const children = category ? majors.filter((major) => major.parentCode === category) : []

    const onDismiss = () => {
        markNudgeDismissed(NUDGE_ID)
        setDismissed(true)
    }

    const onPickCategory = (code: string) => {
        setCategory(code)
        // Đổi khối thì bỏ chuyên ngành đã chọn — nếu không, bấm "Quay lại" rồi sang khối khác sẽ
        // lưu một mã con KHÔNG thuộc khối đang hiện trên màn hình.
        setChild(null)
        setFailed(false)
    }

    const onBack = () => {
        setCategory(null)
        setChild(null)
        setFailed(false)
    }

    /**
     * Chưa chọn xong. Khối CÓ chuyên ngành con mà chưa bấm con nào (kể cả nút "Tất cả
     * {khối}") ⇒ Lưu phải khoá. Trước đây nút Lưu vẫn bấm được ở trạng thái này và
     * `child ?? category` âm thầm ghi mã KHỐI vào hồ sơ, trong khi người dùng đinh ninh
     * ngành đã chọn ở bước 1 — không có một dấu hiệu nào trên màn nói "chưa chọn gì".
     */
    const nothingPicked = children.length > 0 && child === null

    const onSave = async () => {
        if (category === null || nothingPicked) {
            return
        }
        setSaving(true)
        setFailed(false)
        try {
            // Tới đây `child ?? category` chỉ còn rơi vào nhánh `category` ở ĐÚNG một ca: khối
            // KHÔNG có chuyên ngành con (ngõ cụt — bắt chọn con thì không bấm tiếp được). Ca
            // "khối có con mà chưa bấm con nào" đã bị `nothingPicked` chặn ở trên, nên mọi mã
            // ghi lên hồ sơ đều là mã người dùng đã bấm và đang thấy ở trạng thái `primary`.
            await setMajor(child ?? category)
            // Lưu xong đánh dấu đã xong luôn: `needsMajor` sẽ tự thành false sau khi revalidate,
            // nhưng đánh dấu ở đây để modal không nháy lại trong lúc chờ.
            markNudgeDismissed(NUDGE_ID)
            setDismissed(true)
        } catch {
            // BE từ chối (mã lạ / mất mạng): GIỮ modal trên màn hình + báo lỗi, KHÔNG nuốt im rồi
            // đóng như thể đã lưu được.
            setFailed(true)
        } finally {
            setSaving(false)
        }
    }

    if (!authenticated || dismissed || tourActive || !needsMajor || categories.length === 0) {
        return null
    }

    const atCategoryStep = category === null
    const categoryName = majors.find((major) => major.code === category)?.name ?? ""
    const stepBody = atCategoryStep
        ? t("body")
        : children.length > 0
            ? t("specializationBody", { major: categoryName })
            : t("noSpecialization", { major: categoryName })

    return (
        <Modal
            isOpen
            onOpenChange={(open) => {
                // Đóng bằng Esc hoặc bấm ra nền = "Để sau": cùng một ý định nên nhớ cùng một cách,
                // đừng để khảo sát quay lại ở lần vào workplace kế tiếp.
                //
                // NHƯNG không phải trong lúc đang GHI. Đóng giữa chừng vừa đánh dấu "Để sau"
                // VĨNH VIỄN trên thiết bị này, vừa unmount cây trước khi `setMajor` settle — BE
                // từ chối thì `setFailed(true)` chạy trên cây đã chết và người dùng không thấy
                // một chữ báo lỗi nào, hồ sơ vẫn trống, mà khảo sát thì không bao giờ quay lại.
                // Chốt cuối ở đây phòng khi HeroUI đổi cách truyền prop xuống backdrop.
                if (!open) {
                    if (saving) {
                        return
                    }
                    onDismiss()
                }
            }}
        >
            {/* Hai cửa đóng, khoá cả hai khi đang ghi: `isDismissable` lo cú bấm ra nền,
                `isKeyboardDismissDisabled` lo phím Esc (react-aria `ModalOverlay` nhận prop
                này). Modal chỉ đóng khi `setMajor` đã settle — thành công thì đóng, thất bại
                thì ở lại và hiện `t("error")`. */}
            <Modal.Backdrop isDismissable={!saving} isKeyboardDismissDisabled={saving}>
                <Modal.Container>
                    {/* Tiêu đề nằm trong bong bóng linh vật chứ không ở `Modal.Header`, nên hộp
                        thoại phải tự mang tên — không có nhãn thì trình đọc màn hình chỉ đọc
                        "dialog". */}
                    <Modal.Dialog aria-label={t("title")} className="w-full max-w-lg">
                        <Modal.Body>
                            {/* Hàng nút đi qua prop `actions`, KHÔNG qua `children`.
                                `MascotBubble` bọc `title` + `children` trong một vùng
                                `aria-live="polite"` còn `actions` render ở div anh em NGOÀI
                                vùng đó — sự tách đôi đó là cố ý. Nhét nút vào `children` thì
                                mỗi lần đổi bước, trình đọc màn hình bắn một thông báo polite
                                đọc lại tiêu đề + body + tên MỌI ngành trong danh sách, chồng
                                lên thông báo focus, và câu thật của bước thì chìm nghỉm. */}
                            <MascotBubble
                                pose={atCategoryStep ? "greeting" : "point"}
                                size="md"
                                title={atCategoryStep ? t("title") : t("specializationTitle")}
                                actions={
                                    <>
                                        {/* "Tất cả {khối}" — chọn KHỐI phải là một hành động RÕ
                                            RÀNG, không phải trạng thái mặc định. Dùng lại đúng
                                            nhãn của ô cấp 2 ở SubjectCatalog để hai chỗ nói
                                            cùng một câu cho cùng một lựa chọn. */}
                                        {!atCategoryStep && children.length > 0 ? (
                                            <Button
                                                size="sm"
                                                variant={
                                                    child !== null && child === category
                                                        ? "primary"
                                                        : "secondary"
                                                }
                                                isDisabled={saving}
                                                onPress={() => setChild(category)}
                                            >
                                                {tCatalog("allInMajor", { major: categoryName })}
                                            </Button>
                                        ) : null}
                                        {(atCategoryStep ? categories : children).map((major) => (
                                            <Button
                                                key={major.code}
                                                size="sm"
                                                // Bước 2 là chọn-rồi-Lưu nên nút phải cho thấy cái nào
                                                // đang được chọn; bước 1 bấm là đi tiếp ngay.
                                                variant={
                                                    atCategoryStep || child === major.code
                                                        ? "primary"
                                                        : "secondary"
                                                }
                                                isDisabled={saving}
                                                onPress={() =>
                                                    atCategoryStep
                                                        ? onPickCategory(major.code)
                                                        : setChild(major.code)
                                                }
                                            >
                                                {major.name}
                                            </Button>
                                        ))}
                                    </>
                                }
                            >
                                {failed ? t("error") : stepBody}
                            </MascotBubble>
                        </Modal.Body>
                        <Modal.Footer className="justify-between gap-2">
                            <Button
                                size="sm"
                                variant="tertiary"
                                isDisabled={saving}
                                onPress={atCategoryStep ? onDismiss : onBack}
                            >
                                {atCategoryStep ? t("dismiss") : tCommon("back")}
                            </Button>
                            {/* Nút Lưu chỉ có ở bước 2 — bước 1 chưa có gì để lưu. */}
                            {atCategoryStep ? null : (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    isPending={saving}
                                    isDisabled={saving || nothingPicked}
                                    onPress={() => void onSave()}
                                >
                                    {tCommon("save")}
                                </Button>
                            )}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
