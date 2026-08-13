"use client"

import { create } from "zustand"

/** Text field of the sign-in form. */
type SignInField = "email" | "password" | "otp"

/**
 * Chi tiết khoá tài khoản, đọc từ `data` của lỗi 423 `IDENTITY_ACCOUNT_LOCKED`.
 *
 * Mọi trường đều optional: backend cũ (trước change `identity-device-ban-appeal`) chỉ trả
 * `unlockAt`, và màn hình phải hiển thị tử tế với đúng những gì nó nhận được thay vì hiện "undefined".
 */
export interface SignInLockInfo {
    /** Lý do khoá, backend soạn từ thiết bị có thật ("Đăng nhập từ 6 thiết bị trong 30 ngày: …"). */
    reason?: string
    /** `ADMIN` = admin khoá (khiếu nại được) · `AUTO` = khoá tạm do sai mật khẩu nhiều lần. */
    lockType?: "ADMIN" | "AUTO"
    lockedAt?: string
    /** Thời điểm tự mở khoá — chỉ có với khoá AUTO. */
    unlockAt?: string
    /** Số lần tài khoản đã bị admin khoá ("đã vi phạm N lần"). */
    violationCount?: number
    /** Backend cho phép gửi đơn hay không (false khi khoá AUTO hoặc đã có đơn đang chờ). */
    canAppeal?: boolean
    hasPendingAppeal?: boolean
}

/**
 * Zustand store for the sign-in form — SHARED so values (email, challengeId…) survive the
 * Credentials → OTP step transition (CredentialsState unmounts, OtpState mounts). Previously a
 * formik singleton.
 */
interface SignInStoreState {
    /** Email. */
    email: string
    /** Whether the email exists in the DB (bloom filter). */
    emailExists: boolean
    /** Password. */
    password: string
    /** 6-digit OTP. */
    otp: string
    /** challengeId from signInInit, used to verify the OTP. */
    challengeId?: string
    /** Captcha token from Turnstile widget. */
    captchaToken?: string
    /** Persist the session. */
    rememberMe: boolean
    /** Chi tiết khoá tài khoản, set khi login trả 423; bước `Locked` đọc từ đây. */
    lockInfo?: SignInLockInfo
    /** Touched fields. */
    touched: Record<SignInField, boolean>
    /** Whether a submit is in flight. */
    isSubmitting: boolean
    /** Set one field's value. */
    setValue: (field: keyof Omit<SignInStoreState, "touched" | "isSubmitting" | "lockInfo" | "setValue" | "setTouched" | "setIsSubmitting" | "setLockInfo" | "reset">, value: string | boolean | undefined) => void
    /**
     * Ghi chi tiết khoá. Setter RIÊNG chứ không đi qua `setValue`: `setValue` nhận
     * `string | boolean | undefined`, nhét một object vào đó sẽ phải nới kiểu của MỌI field trong
     * form thành `unknown` và mất luôn phần kiểm kiểu đang có.
     */
    setLockInfo: (value: SignInLockInfo | undefined) => void
    /** Mark one field as touched. */
    setTouched: (field: SignInField, value: boolean) => void
    /** Set the submitting flag. */
    setIsSubmitting: (value: boolean) => void
    /** Reset the whole form. */
    reset: () => void
}

const initialState = {
    email: "",
    emailExists: true,
    password: "",
    otp: "",
    challengeId: undefined as string | undefined,
    captchaToken: undefined as string | undefined,
    lockInfo: undefined as SignInLockInfo | undefined,
    rememberMe: false,
    touched: { email: false, password: false, otp: false },
    isSubmitting: false,
}

/** Shared store for the sign-in form. */
export const useSignInStore = create<SignInStoreState>((set) => ({
    ...initialState,
    setValue: (field, value) => set({ [field]: value } as Partial<SignInStoreState>),
    setTouched: (field, value) => set((state) => ({ touched: { ...state.touched, [field]: value } })),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    setLockInfo: (lockInfo) => set({ lockInfo }),
    reset: () => set({ ...initialState }),
}))
