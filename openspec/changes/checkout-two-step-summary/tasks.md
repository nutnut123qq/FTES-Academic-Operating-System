# Tasks — checkout-two-step-summary

## 1. Carry the course cover through the payment context
- [x] 1.1 `modules/types/payment.ts`: thêm `imageUrl?: string` (cover khóa cho thumbnail bước Tóm tắt; bỏ với giỏ nhiều item)
- [x] 1.2 `PackageGateModal.useProductCheckout`: thêm tham số `imageUrl`, truyền `imageUrl: imageUrl || undefined` vào `payment.open`
- [x] 1.3 `PackageGateModal`: `WholeCoursePanel` + `PackagePanel` truyền `imageUrl: courseCoverUrl`; `WholeCourseGateCard` thêm prop `courseCoverUrl` → `imageUrl`
- [x] 1.4 `CourseDetail`: `onBuyPackage` truyền `imageUrl: course.coverUrl`; `<WholeCourseGateCard courseCoverUrl={course.coverUrl}>`; buy-context `useCourseEnrollment` thêm `coverUrl: course.coverUrl`
- [x] 1.5 `useCourseEnrollment`: thêm `coverUrl` vào `CourseEnrollmentBuyContext`, truyền `imageUrl: buy?.coverUrl || undefined` vào `payment.open`
- [x] 1.6 `LearnContentPage`: buy-context truyền `coverUrl: header?.coverUrl`
- [x] 1.7 Giỏ (`CartShell`, `MiniCartDrawer`): giữ nguyên, KHÔNG truyền `imageUrl` (nhiều item, không có cover chung)

## 2. Two-step layout in PaymentModal
- [x] 2.1 `PaymentModal`: `const [step, setStep] = useState<"summary"|"payment">("summary")`; reset `"summary"` trong effect mở modal
- [x] 2.2 Guard effect: `if (isSummaryLocked(phase)) setStep("payment")` — helper `isSummaryLocked(phase) = phase !== "choose"` (export cho test)
- [x] 2.3 Header: `SegmentedControl<Step>` (items Tóm tắt/Thanh toán) buộc `step`; đoạn "Tóm tắt" `isDisabled={isSummaryLocked(phase)}`
- [x] 2.4 Bước Tóm tắt: `CoverImage` (khi `imageUrl`) + `title`; giá to/đậm (`h3` hoặc `PriceTag size="lg"` khi có giảm) + dòng `text-success` tiết kiệm; nút primary "Tiếp tục thanh toán →" (`ArrowRightIcon`) → `setStep("payment")`
- [x] 2.5 Bước Thanh toán: recap gọn (thumbnail nhỏ + tên + số tiền) + `ChooseView`/`AwaitingView`/`SuccessView`/`FailedView` theo `phase` y như cũ
- [x] 2.6 COIN: không hiện tiết kiệm; Tóm tắt vẫn hiện số Xu khi VND = 0 (dùng lại `summaryAmount`)

## 3. i18n
- [x] 3.1 `payment.checkout.{summaryTab, paymentTab, continueToPayment}` vi + en (mirrored, cùng thứ tự key)

## 4. Verify
- [x] 4.1 `stepGating.test.ts`: `isSummaryLocked("choose") === false`; `awaiting`/`success`/`failed` === true
- [x] 4.2 Giữ `summaryAmount` + `summaryAmount.test.ts` nguyên vẹn
- [x] 4.3 `node_modules/.bin/tsc --noEmit` → exit 0
- [x] 4.4 `node_modules/.bin/vitest run src/components/modals/PaymentModal src/components/features/cart` → xanh (12 test)
