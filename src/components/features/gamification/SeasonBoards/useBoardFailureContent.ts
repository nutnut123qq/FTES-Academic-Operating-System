"use client"

import { useTranslations } from "next-intl"
import type { ErrorContentProps } from "@/components/blocks/async/ErrorContent"
import { RestError } from "@/modules/api/rest/client"
import { classifyBoardFailure } from "./model"

/** Mã trạng thái đọc được từ một lỗi bất kỳ (đứt mạng ⇒ status 0 ⇒ hiện "—"). */
const statusText = (error: unknown): string => {
    if (error instanceof RestError && error.status > 0) {
        return String(error.status)
    }
    return "—"
}

/**
 * Đổi một lỗi tải bảng/khung thành nội dung {@link ErrorContentProps} NÓI ĐƯỢC THÀNH LỜI.
 *
 * ★ Đây là chỗ thực thi luật "RỖNG ≠ LỖI" ở tầng nhìn thấy được: khi lane BE chưa
 * merge, endpoint trả 404 và người đọc phải thấy đúng câu "máy chủ chưa có endpoint
 * này", kèm ĐƯỜNG DẪN + MÃ TRẠNG THÁI để người sửa biết đi đâu. Một màn "chưa có ai
 * lên bảng" ở tình huống đó là nói dối, và là kiểu nói dối không ai đi sửa vì nó
 * không kêu.
 *
 * @returns `null` khi không có lỗi — người gọi tiếp tục nhánh rỗng/nội dung như thường.
 */
export const useBoardFailureContent = () => {
    const t = useTranslations("gamification.seasonBoards.failure")

    return (
        error: unknown,
        endpoint: string,
        onRetry?: () => void,
    ): ErrorContentProps | null => {
        const failure = classifyBoardFailure(error)
        if (!failure) {
            return null
        }
        const values = { endpoint, status: statusText(error) }
        const copy =
            failure === "NOT_DEPLOYED"
                ? { title: t("notDeployedTitle"), description: t("notDeployedDescription", values) }
                : failure === "UNAUTHENTICATED"
                    ? {
                        title: t("unauthenticatedTitle"),
                        description: t("unauthenticatedDescription", values),
                    }
                    : { title: t("failedTitle"), description: t("failedDescription", values) }

        return {
            ...copy,
            // Không gắn nút "thử lại" cho 404: route không tồn tại thì bấm bao nhiêu
            // lần cũng thế, nút đó chỉ biến lỗi hạ tầng thành lỗi "tại mạng của bạn".
            onRetry: failure === "NOT_DEPLOYED" ? undefined : onRetry,
            retryLabel: failure === "NOT_DEPLOYED" ? undefined : t("retry"),
        }
    }
}
