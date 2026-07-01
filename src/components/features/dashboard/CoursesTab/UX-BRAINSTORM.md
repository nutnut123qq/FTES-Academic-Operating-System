# UX Brainstorm — Courses tab (my courses · recommended + loyalty discount)  — 2026-06-18

> `/ux-brainstorm` theo feedback: (1) "Khóa học của tôi" dựng theo style card progress của PROFILE (SegmentBar +
> legend dots); (2) "Khóa học cho bạn" = khóa **CHƯA MUA**, có **giảm giá ĐỘC QUYỀN vì chăm chỉ / đăng ký nhiều khóa**.
> KHÔNG code → `/ux-apply`.

## 0. Audit + data thật

- **My courses** (`MyCoursesProgress`): hiện 3 `ProgressBar` xếp dọc/khóa (content/challenge/milestone, "X/Y"). Profile
  Overview "Khóa học" (mẫu thầy đưa) = **1 thanh + legend dots** (Nội dung·Thử thách·Milestone + count) + `%` phải →
  gọn, đẹp hơn. Data: `myCourses` (ProgressProjection): `contentCompleted/Total · challengeCompleted/Total ·
  completed/total(milestone) · completionPercent`.
- **Recommended** (`RecommendedCourses`): `useQueryCoursesSwr` (ES tất cả khóa) → lọc not-enrolled **client-side theo
  title** (mong manh) → 3 khóa; chỉ hiện cover+title+desc. Legacy (`@gravity-ui`, `<button>`+`<span>`+text-class, gap-1.5).
- **Giá**: `course.originalPrice` (VND) + `originalPriceUsd` + `pricingPhases` (pioneer/earlyBird/regular) +
  `metadata.currentPhase` → `CoursePricingService` ra giá theo phase.
- **Discount/loyalty: KHÔNG TỒN TẠI.** Không entity discount/coupon/bundle; `CoursePricingService` không hề rẽ nhánh
  theo user. Membership docstring nhắc "member course discount" nhưng **chưa wire**. → discount hiện tại = **0 thực thi**.

## 1. ⚠️ Nguyên tắc TRUNG THỰC (chốt trước)

"Giảm giá độc quyền" PHẢI là **giá THẬT user trả** (charged = shown), KHÔNG fake `price*0.9` ở FE. Hiển thị "−X%" mà
checkout vẫn full giá = lừa + vỡ contract (vi phạm branding-first/no-over-claim, main §14). → muốn có discount thì
**phải thêm cơ chế BE thật**; nếu không, KHÔNG hiện %.

## 2. Hướng

- **A — CHỐT: loyalty discount THẬT (BE + FE).** Thêm cơ chế discount theo engagement + số khóa đã mua; áp ĐÚNG ở
  `CoursePricingService` (charged = shown) + hiện trên recommended. Frame "độc quyền vì bạn chăm chỉ". Trung thực + tạo động lực thật.
- **B — copy "ưu đãi" KHÔNG có %** (không đổi giá): trung thực nhưng yếu, không phải cái thầy muốn. Loại.
- **C — fake % ở FE:** LOẠI (lừa, vỡ contract).

→ **Chốt A** (cần BE — nêu rõ, đừng fake).

## 3. Cơ chế discount đề xuất (BE mới — minimal)

**Cơ sở (data sẵn):** số khóa đã mua (`enrollments` count) + chăm chỉ (`user.totalPoints`/streak/contribution). Thầy chốt:
"giảm vì đăng ký NHIỀU khóa" → trục chính = **enrolledCount**; "vì chăm chỉ" → cộng theo engagement.
- `computeLoyaltyDiscount(user)` → `{ percent, reasonKey }`: vd base 0 + **mỗi khóa đã mua +5%** (bundle/loyalty) +
  bonus chăm chỉ (streak≥N hoặc XP≥ngưỡng +5%), **cap 30%**. `reasonKey` = `enrolledCount` | `diligent` (để FE chọn copy).
- **Áp ĐÚNG 1 chỗ:** `CoursePricingService.resolveAmountVnd/Usd(course, user)` nhân `(1 - percent)`; lưu `discountPercent`
  lên `TransactionEntity` (audit). → giá hiện = giá trừ = giá charge.
- **Query recommended chuẩn (thay lọc-title client):** `recommendedCourses` BE → loại enrolled (qua enrolled-set cache) +
  trả `{ course, originalPriceVnd, discountedPriceVnd, discountPercent, reasonKey, priceUsd… }`. (Bỏ lọc title mong manh.)

(Nếu thầy CHƯA muốn đụng pricing core → tối thiểu: 1 query trả discountedPrice cho recommended để HIỂN THỊ, NHƯNG phải
áp cùng rate lúc enroll — KHÔNG hiện nếu chưa áp được ở checkout.)

## 4. IA mới (Courses tab)

- **`LabeledCard "Khóa học của tôi"`** (framed): mỗi khóa = row kiểu profile — title + `%` phải, **1 `SegmentBar`**
  (segments: nội dung/thử thách/milestone theo `getXxx` màu) + **legend dots** (label·count) dưới. (Mirror
  `ProfileOverviewTab/OverviewCourses`.) Empty → CTA "Khám phá khóa học".
- **`LabeledCard "Khóa học cho bạn"`** (hoặc frameless nếu mỗi item là `PressableCard`): mỗi khóa CHƯA MUA = card:
  cover + title + desc ngắn + **giá VND** (gốc gạch + giá sau giảm to) + **chip "Ưu đãi độc quyền −X%"** + dòng copy
  **"Độc quyền cho bạn vì bạn chăm chỉ"** / **"Vì bạn đã học N khóa"** (theo `reasonKey`) + CTA "Xem khóa". USD "≈ $Y" muted (rule price-vnd).
  - Dựng sạch: phosphor (`CompassIcon`→phosphor), Typography, `PressableCard`/`LanguageChip`-style — bỏ `<button>`+span legacy.

## 5. Section → data

| Khối | Data | Ghi chú |
|---|---|---|
| Khóa của tôi | `myCourses` (content/challenge/milestone + percent) | SegmentBar + legend dots (mirror profile) |
| Recommended list | `recommendedCourses` (MỚI, BE loại enrolled) | thay lọc-title client |
| Giá + discount | `course.originalPrice`/`pricingPhase` + **`discountPercent`/`discountedPrice` (MỚI)** | charged=shown |
| Copy "vì chăm chỉ / N khóa" | `reasonKey` (từ enrolledCount/engagement) | i18n theo reason |

## 6. Cắt / Thêm / BE
- **Sửa FE:** MyCoursesProgress → SegmentBar+legend (mirror OverviewCourses); RecommendedCourses → rebuild sạch + giá + discount chip + copy.
- **BE MỚI (nêu rõ, đừng fake — làm bằng workflow như daily-quest):** `computeLoyaltyDiscount` + áp vào `CoursePricingService`
  (charged=shown, lưu `transaction.discountPercent`) + query `recommendedCourses` trả giá gốc/giảm + `reasonKey` + loại enrolled.
- **Trung thực:** KHÔNG hiện "−X%" nếu BE chưa charge đúng. Discount = engagement-based thật (enrolledCount + chăm chỉ), không vanity rỗng.
- States: AsyncContent từng khối; recommended rỗng (mua hết) → ẩn; giá loading skeleton.

## 7. Mở (chốt lúc /ux-apply)
- Công thức discount: **+5%/khóa đã mua + 5% nếu chăm chỉ (streak≥7 hoặc XP≥ngưỡng), cap 30%** (đề xuất) — thầy chốt số.
- Reason copy: ưu tiên "vì đã học N khóa" hay "vì chăm chỉ (streak)" khi cả hai đủ điều kiện? → mặc định gộp: "Vì bạn chăm chỉ & đã học N khóa".
